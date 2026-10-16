import { ACT_MINUTE, InputKind, SIT_IN_CHARGE, Side, TICKS_PER_MINUTE, type State } from '@suc/sim';
import { h } from '../dom.ts';
import { queueInput, type Session } from './session.ts';

const ACT_TICK = ACT_MINUTE * TICKS_PER_MINUTE;

export interface ActionButton {
  readonly label: string;
  readonly detail: string;
  readonly kind: InputKind;
  readonly charge: (state: State) => number;
}

const SIT_IN: ActionButton = {
  label: 'Sit-in',
  detail: '4 s · untouchable',
  kind: InputKind.SitIn,
  charge: (state) =>
    state.tick < ACT_TICK
      ? 0
      : Math.min(1, 1 - (state.timers.sitInReadyAt - state.tick) / SIT_IN_CHARGE),
};

export const ACTIONS: Readonly<Record<Side, readonly ActionButton[]>> = {
  [Side.Agency]: [],
  [Side.Cockroach]: [SIT_IN],
};

export interface Controls {
  readonly element: HTMLElement;
  readonly trigger: () => void;
  readonly update: (state: State) => void;
}

const actionView = (action: ActionButton, session: Session) => {
  const fill = h('span', { className: 'action__charge' });
  const button = h(
    'button',
    {
      className: 'action',
      attrs: { type: 'button' },
      onClick: () => {
        queueInput(session, action.kind, 0, 0, 0);
      },
    },
    [
      fill,
      h('span', { className: 'action__label', text: action.label }),
      h('span', { className: 'action__detail', text: action.detail }),
    ],
  );
  let shown = -1;
  return {
    button,
    update: (state: State): void => {
      const charge = Math.max(0, action.charge(state));
      if (charge === shown) return;
      shown = charge;
      button.disabled = charge < 1;
      fill.style.transform = `scaleX(${String(charge)})`;
    },
  };
};

export const createControls = (session: Session): Controls => {
  const views = ACTIONS[session.state.side].map((action) => actionView(action, session));
  const element = h(
    'footer',
    { className: 'controls' },
    views.map((view) => view.button),
  );
  return {
    element,
    trigger: () => {
      views[0]?.button.click();
    },
    update: (state) => {
      for (const view of views) view.update(state);
    },
  };
};
