import { MomentKind, type State } from '@suc/sim';
import { h } from '../../dom.ts';
import type { Session } from '../session.ts';
import { fakeView } from './fake.ts';
import { placardView } from './placard.ts';
import type { MomentView } from './view.ts';

type MomentFactory = (state: State) => MomentView;

const factories = (session: Session): Readonly<Record<MomentKind, MomentFactory | null>> => ({
  [MomentKind.None]: null,
  [MomentKind.Fake]: fakeView,
  [MomentKind.Placard]: placardView(session),
});

export interface MomentOverlay {
  readonly element: HTMLElement;
  readonly update: (state: State) => void;
}

export const createMomentOverlay = (session: Session): MomentOverlay => {
  const table = factories(session);
  const element = h('div', { className: 'moments' });
  let shown = '';
  let view: MomentView | null = null;
  return {
    element,
    update: (state) => {
      const key = `${String(state.moment.kind)}:${String(state.moment.opensAt)}`;
      if (key !== shown) {
        shown = key;
        view = table[state.moment.kind]?.(state) ?? null;
        element.replaceChildren(...(view ? [view.element] : []));
      }
      view?.update(state);
    },
  };
};
