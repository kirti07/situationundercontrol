import type { State } from '@suc/sim';

export interface Renderer {
  readonly resize: () => void;
  readonly ingest: (state: State, now: number) => void;
  readonly draw: (state: State, alpha: number, now: number) => void;
}
