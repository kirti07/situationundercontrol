import type { Character, Side } from '@suc/sim';
import type { RunSummary } from './content/endings.ts';

export interface PlayParams {
  readonly side: Side;
  readonly character: Character;
}

export interface FrontParams {
  readonly invited: Side | null;
}

export interface ResultParams {
  readonly play: PlayParams;
  readonly run: RunSummary;
}

export interface ScreenParams {
  readonly front: FrontParams;
  readonly roster: undefined;
  readonly howto: undefined;
  readonly play: PlayParams;
  readonly result: ResultParams;
}

export type ScreenId = keyof ScreenParams;

export interface Screen {
  readonly element: HTMLElement;
  readonly unmount: () => void;
}

export type Navigate = <K extends ScreenId>(id: K, params: ScreenParams[K]) => void;

export type ScreenFactory<K extends ScreenId> = (
  params: ScreenParams[K],
  navigate: Navigate,
) => Screen;

export type ScreenLoaders = { readonly [K in ScreenId]: () => Promise<ScreenFactory<K>> };

export const createRouter = (root: HTMLElement, loaders: ScreenLoaders): Navigate => {
  let current: Screen | undefined;
  let generation = 0;
  const navigate: Navigate = (id, params) => {
    generation += 1;
    const requested = generation;
    void loaders[id]().then((factory) => {
      if (requested !== generation) return;
      current?.unmount();
      current = factory(params, navigate);
      root.replaceChildren(current.element);
      root.dataset.screen = id;
      window.scrollTo(0, 0);
    });
  };
  return navigate;
};
