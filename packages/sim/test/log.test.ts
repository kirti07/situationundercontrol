import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  Character,
  decodeRun,
  encodeRun,
  FIELD_HEIGHT,
  FIELD_WIDTH,
  HAS_POINT,
  INPUT_KINDS,
  InputKind,
  MAX_LOG_BYTES,
  RUN_ID_BYTES,
  RUN_TICKS,
  Side,
  SIM_VERSION,
  type Input,
  type RunLog,
} from '../src/index.ts';

const header = {
  simVersion: SIM_VERSION,
  edition: 12,
  side: Side.Agency,
  character: Character.PrimeTime,
  runId: new Uint8Array(RUN_ID_BYTES).fill(7),
};

const inputArbitrary = fc
  .record({
    tick: fc.integer({ min: 0, max: RUN_TICKS - 1 }),
    kind: fc.constantFrom(...INPUT_KINDS),
    pointer: fc.integer({ min: 0, max: 1 }),
    x: fc.integer({ min: 0, max: FIELD_WIDTH }),
    y: fc.integer({ min: 0, max: FIELD_HEIGHT }),
  })
  .map((input) => ({
    ...input,
    x: HAS_POINT[input.kind] ? input.x : 0,
    y: HAS_POINT[input.kind] ? input.y : 0,
  }));

const sortedInputs = fc
  .array(inputArbitrary, { maxLength: 300 })
  .map((inputs): Input[] => inputs.toSorted((a, b) => a.tick - b.tick));

const reasonOf = (bytes: Uint8Array): string => {
  const result = decodeRun(bytes);
  return result.ok ? 'ok' : result.reason;
};

describe('run log codec', () => {
  it('round-trips any sorted input log', () => {
    fc.assert(
      fc.property(sortedInputs, (inputs) => {
        const log: RunLog = { header, inputs };
        const result = decodeRun(encodeRun(log));
        expect(result).toEqual({ ok: true, log });
      }),
    );
  });

  it('rejects malformed logs', () => {
    const valid = encodeRun({ header, inputs: [] });
    expect(reasonOf(valid.slice(1))).toBe('bad magic');
    expect(reasonOf(Uint8Array.from([...valid, 0]))).toBe('trailing bytes');
    expect(reasonOf(valid.slice(0, 10))).toBe('truncated');
    expect(reasonOf(new Uint8Array(MAX_LOG_BYTES + 1))).toBe('log too large');
    expect(
      reasonOf(encodeRun({ header: { ...header, simVersion: SIM_VERSION + 1 }, inputs: [] })),
    ).toBe('version mismatch');
    expect(
      reasonOf(encodeRun({ header: { ...header, character: Character.None }, inputs: [] })),
    ).toBe('bad character');
    const late: Input = { tick: RUN_TICKS, kind: InputKind.Tap, pointer: 0, x: 1, y: 1 };
    expect(reasonOf(encodeRun({ header, inputs: [late] }))).toBe('tick out of range');
    const wide: Input = { tick: 1, kind: InputKind.Tap, pointer: 0, x: FIELD_WIDTH + 1, y: 1 };
    expect(reasonOf(encodeRun({ header, inputs: [wide] }))).toBe('x out of range');
  });

  it('never throws on random bytes', () => {
    fc.assert(
      fc.property(fc.uint8Array({ maxLength: 512 }), (bytes) => {
        expect(() => decodeRun(bytes)).not.toThrow();
      }),
    );
  });
});
