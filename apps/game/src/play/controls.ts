import {
  ACT_MINUTE,
  Character,
  InputKind,
  POWER_CHARGE,
  SIT_IN_CHARGE,
  Side,
  TICKS_PER_MINUTE,
  type State,
} from '@suc/sim';
import { CHARACTERS } from '../content/roster.ts';
import { h } from '../dom.ts';
import { queueInput, type Session } from './session.ts';

const ACT_TICK = ACT_MINUTE * TICKS_PER_MINUTE;

interface ActionButton {
  readonly label: string;
  readonly detail: string;
  readonly kind: InputKind;
  readonly charge: (state: State) => number;
}

const chargeOf = (state: State, readyAt: number, duration: number): number =>
  state.tick < ACT_TICK ? 0 : Math.min(1, 1 - (readyAt - state.tick) / duration);

const SIT_IN: ActionButton = {
  label: 'Sit-in',
  detail: CHARACTERS[Character.None].effect,
  kind: InputKind.SitIn,
  charge: (state) => chargeOf(state, state.timers.sitInReadyAt, SIT_IN_CHARGE),
};

const powerOf = (state: State): ActionButton => ({
  label: CHARACTERS[state.character].power,
  detail: CHARACTERS[state.character].effect,
  kind: InputKind.Power,
  charge: (current) => chargeOf(current, current.timers.powerReadyAt, POWER_CHARGE),
});

const ACTIONS: Readonly<Record<Side, (state: State) => readonly ActionButton[]>> = {
  [Side.Agency]: (state) => [powerOf(state)],
  [Side.Cockroach]: () => [SIT_IN],
};

interface ActionView {
  readonly button: HTMLButtonElement;
  readonly update: (state: State) => void;
}

const actionView = (action: ActionButton, session: Session): ActionView => {
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
    update: (state) => {
      const charge = Math.max(0, action.charge(state));
      if (charge === shown) return;
      shown = charge;
      button.disabled = charge < 1;
      fill.style.transform = `scaleX(${String(charge)})`;
    },
  };
};

const listenButton = (session: Session): HTMLButtonElement => {
  const button = h('button', { className: 'listen', attrs: { type: 'button' } }, [
    h('span', { className: 'listen__ring' }),
    h('span', { className: 'listen__label', text: 'Actually Listen' }),
  ]);
  const release = (): void => {
    if (!button.classList.contains('listen--holding')) return;
    button.classList.remove('listen--holding');
    queueInput(session, InputKind.ListenUp, 0, 0, 0);
  };
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    button.classList.add('listen--holding');
    queueInput(session, InputKind.ListenDown, 0, 0, 0);
  });
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  return button;
};

const EXTRAS: Readonly<Record<Side, (session: Session) => readonly HTMLElement[]>> = {
  [Side.Agency]: (session) => [listenButton(session)],
  [Side.Cockroach]: () => [],
};

export interface Controls {
  readonly element: HTMLElement;
  readonly trigger: () => void;
  readonly update: (state: State) => void;
}

export const createControls = (session: Session): Controls => {
  const views = ACTIONS[session.state.side](session.state).map((action) =>
    actionView(action, session),
  );
  const element = h('footer', { className: 'controls' }, [
    ...views.map((view) => view.button),
    ...EXTRAS[session.state.side](session),
  ]);
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
