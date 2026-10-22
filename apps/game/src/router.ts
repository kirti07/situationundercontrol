import type { CharacterId, Side } from './content/roles.ts';

export interface Routes {
  readonly home: undefined;
  readonly select: undefined;
  readonly play: { readonly side: Side; readonly character?: CharacterId };
}

export type Route = keyof Routes;

export type Navigate = <R extends Route>(
  route: R,
  ...params: Routes[R] extends undefined ? [] : [Routes[R]]
) => void;

export interface Screen {
  readonly root: HTMLElement;
  readonly dispose?: () => void;
}

export type ScreenFactory<R extends Route> = (navigate: Navigate, params: Routes[R]) => Screen;

export type Loaders = { readonly [R in Route]: () => Promise<ScreenFactory<R>> };

export const createRouter = (host: HTMLElement, loaders: Loaders): Navigate => {
  let current: Screen | undefined;
  let request = 0;
  const navigate: Navigate = (route, ...params) => {
    request += 1;
    const mine = request;
    void loaders[route]().then((factory) => {
      if (mine !== request) return;
      current?.dispose?.();
      current = (factory as (navigate: Navigate, params: unknown) => Screen)(navigate, params[0]);
      host.replaceChildren(current.root);
      window.scrollTo(0, 0);
    });
  };
  return navigate;
};
