export const InputKind = {
  Tap: 0,
  SitIn: 1,
  Power: 2,
  ListenDown: 3,
  ListenUp: 4,
  Answer: 5,
  Steer: 6,
  SteerEnd: 7,
} as const;
export type InputKind = (typeof InputKind)[keyof typeof InputKind];

export const INPUT_KINDS: readonly InputKind[] = Object.values(InputKind);

export const HAS_POINT: Readonly<Record<InputKind, boolean>> = {
  [InputKind.Tap]: true,
  [InputKind.SitIn]: false,
  [InputKind.Power]: false,
  [InputKind.ListenDown]: false,
  [InputKind.ListenUp]: false,
  [InputKind.Answer]: true,
  [InputKind.Steer]: true,
  [InputKind.SteerEnd]: false,
};

export interface Input {
  readonly tick: number;
  readonly kind: InputKind;
  readonly pointer: number;
  readonly x: number;
  readonly y: number;
}
