export interface Painter {
  readonly life: number;
  readonly draw: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    value: number,
    age: number,
  ) => void;
}
