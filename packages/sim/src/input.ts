export const InputKind = { Tap: 0 } as const;
export type InputKind = (typeof InputKind)[keyof typeof InputKind];

export const INPUT_KINDS: readonly InputKind[] = Object.values(InputKind);

export interface Input {
  readonly tick: number;
  readonly kind: InputKind;
  readonly pointer: number;
  readonly x: number;
  readonly y: number;
}
