import { FIELD_HEIGHT, FIELD_WIDTH, POINTERS, RUN_TICKS, SIM_VERSION } from './config.ts';
import { HAS_POINT, INPUT_KINDS, type Input } from './input.ts';
import { Character, Side } from './state.ts';

export const MAX_LOG_BYTES = 32768;
const MAX_LOG_EVENTS = 20000;
export const RUN_ID_BYTES = 16;

const MAGIC = [0x53, 0x55, 0x43, 0x01];
const MAX_VARINT_BYTES = 5;

export interface RunHeader {
  readonly simVersion: number;
  readonly edition: number;
  readonly side: Side;
  readonly character: Character;
  readonly runId: Uint8Array;
}

export interface RunLog {
  readonly header: RunHeader;
  readonly inputs: readonly Input[];
}

export type DecodeResult =
  { readonly ok: true; readonly log: RunLog } | { readonly ok: false; readonly reason: string };

const CHARACTERS_FOR: Record<Side, readonly Character[]> = {
  [Side.Agency]: [Character.PrimeTime, Character.Chanakya, Character.PradhanSevak],
  [Side.Cockroach]: [Character.None],
};

const writeVarint = (out: number[], value: number): void => {
  let rest = value;
  while (rest >= 0x80) {
    out.push((rest % 0x80) | 0x80);
    rest = Math.floor(rest / 0x80);
  }
  out.push(rest);
};

export const encodeRun = (log: RunLog): Uint8Array => {
  const out: number[] = [...MAGIC];
  const { header } = log;
  writeVarint(out, header.simVersion);
  writeVarint(out, header.edition);
  out.push(header.side, header.character, ...header.runId);
  writeVarint(out, log.inputs.length);
  let previous = 0;
  for (const input of log.inputs) {
    writeVarint(out, input.tick - previous);
    out.push(input.kind * POINTERS + input.pointer);
    previous = input.tick;
    if (HAS_POINT[input.kind]) {
      writeVarint(out, input.x);
      writeVarint(out, input.y);
    }
  }
  return Uint8Array.from(out);
};

class DecodeError extends Error {}

const check: (condition: boolean, reason: string) => asserts condition = (condition, reason) => {
  if (!condition) throw new DecodeError(reason);
};

class Reader {
  private offset = 0;
  private readonly bytes: Uint8Array;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  byte(): number {
    const value = this.bytes[this.offset];
    check(value !== undefined, 'truncated');
    this.offset += 1;
    return value;
  }

  varint(): number {
    let value = 0;
    let scale = 1;
    for (let length = 0; length < MAX_VARINT_BYTES; length += 1) {
      const byte = this.byte();
      value += (byte & 0x7f) * scale;
      if (byte < 0x80) return value;
      scale *= 0x80;
    }
    throw new DecodeError('varint too long');
  }

  bounded(max: number, reason: string): number {
    const value = this.varint();
    check(value <= max, reason);
    return value;
  }

  finished(): boolean {
    return this.offset === this.bytes.length;
  }
}

const isSide = (value: number): value is Side => value === Side.Agency || value === Side.Cockroach;

const readHeader = (reader: Reader): RunHeader => {
  check(
    MAGIC.every((expected) => reader.byte() === expected),
    'bad magic',
  );
  const simVersion = reader.varint();
  check(simVersion === SIM_VERSION, 'version mismatch');
  const edition = reader.bounded(1_000_000, 'bad edition');
  const side = reader.byte();
  check(isSide(side), 'bad side');
  const character = reader.byte();
  const allowed = CHARACTERS_FOR[side].find((candidate) => candidate === character);
  check(allowed !== undefined, 'bad character');
  const runId = Uint8Array.from({ length: RUN_ID_BYTES }, () => reader.byte());
  return { simVersion, edition, side, character: allowed, runId };
};

const readInput = (reader: Reader, previousTick: number): Input => {
  const tick = previousTick + reader.varint();
  check(tick < RUN_TICKS, 'tick out of range');
  const packed = reader.byte();
  const kind = INPUT_KINDS[Math.floor(packed / POINTERS)];
  check(kind !== undefined, 'bad input kind');
  const pointer = packed % POINTERS;
  const x = HAS_POINT[kind] ? reader.bounded(FIELD_WIDTH, 'x out of range') : 0;
  const y = HAS_POINT[kind] ? reader.bounded(FIELD_HEIGHT, 'y out of range') : 0;
  return { tick, kind, pointer, x, y };
};

const readLog = (bytes: Uint8Array): RunLog => {
  check(bytes.length <= MAX_LOG_BYTES, 'log too large');
  const reader = new Reader(bytes);
  const header = readHeader(reader);
  const count = reader.bounded(MAX_LOG_EVENTS, 'too many inputs');
  const inputs: Input[] = [];
  let tick = 0;
  for (let i = 0; i < count; i += 1) {
    const input = readInput(reader, tick);
    inputs.push(input);
    tick = input.tick;
  }
  check(reader.finished(), 'trailing bytes');
  return { header, inputs };
};

export const decodeRun = (bytes: Uint8Array): DecodeResult => {
  try {
    return { ok: true, log: readLog(bytes) };
  } catch (error) {
    if (error instanceof DecodeError) return { ok: false, reason: error.message };
    throw error;
  }
};
