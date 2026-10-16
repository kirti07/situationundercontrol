export const InputKind = {
  Tap: 0,
  Steer: 1,
  SteerEnd: 2,
  SitIn: 3,
  Power: 4,
  ListenDown: 5,
  ListenUp: 6,
} as const;
export type InputKind = (typeof InputKind)[keyof typeof InputKind];

export const INPUT_KINDS: readonly InputKind[] = Object.values(InputKind);

export const HAS_POINT: Readonly<Record<InputKind, boolean>> = {
  [InputKind.Tap]: true,
  [InputKind.Steer]: true,
  [InputKind.SteerEnd]: false,
  [InputKind.SitIn]: false,
  [InputKind.Power]: false,
  [InputKind.ListenDown]: false,
  [InputKind.ListenUp]: false,
};

export interface Input {
  readonly tick: number;
  readonly kind: InputKind;
  readonly pointer: number;
  readonly x: number;
  readonly y: number;
}
