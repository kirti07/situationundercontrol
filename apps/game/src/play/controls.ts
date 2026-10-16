import {
  ACT_MINUTE,
  InputKind,
  POWER_CHARGE,
  REACHED_QUOTA,
  SIT_IN_CHARGE,
  Side,
  TICKS_PER_MINUTE,
  type State,
} from '@suc/sim';
import { countLabel } from '../content/format.ts';
import { CHARACTERS } from '../content/roster.ts';
import { h } from '../dom.ts';
import { icon, type IconName } from '../ui/icons.ts';
import { queueInput, type Session } from './session.ts';

const ACT_TICK = ACT_MINUTE * TICKS_PER_MINUTE;

interface Tile {
  readonly icon: IconName;
  readonly label: string;
  readonly detail: string;
}

interface ActionTile extends Tile {
  readonly kind: InputKind;
  readonly charge: (state: State) => number;
}

const chargeOf = (state: State, readyAt: number, duration: number): number =>
  state.tick < ACT_TICK ? 0 : Math.min(1, 1 - (readyAt - state.tick) / duration);

const MODE: Readonly<Record<Side, Tile>> = {
  [Side.Agency]: { icon: 'stamp', label: 'Smash', detail: '1 → 3' },
  [Side.Cockroach]: { icon: 'megaphone', label: 'Rally', detail: 'drag a path' },
};

const ACTION: Readonly<Record<Side, (state: State) => ActionTile>> = {
  [Side.Agency]: (state) => ({
    icon: 'badge',
    label: CHARACTERS[state.character].power,
    detail: CHARACTERS[state.character].effect,
    kind: InputKind.Power,
    charge: (current) => chargeOf(current, current.timers.powerReadyAt, POWER_CHARGE),
  }),
  [Side.Cockroach]: () => ({
    icon: 'sitIn',
    label: 'Sit-in',
    detail: '4 s · untouchable',
    kind: InputKind.SitIn,
    charge: (current) => chargeOf(current, current.timers.sitInReadyAt, SIT_IN_CHARGE),
  }),
};

const tileContent = (tile: Tile): readonly Node[] => [
  icon(tile.icon, 'icon tile__icon'),
  h('span', { className: 'tile__label', text: tile.label }),
  h('span', { className: 'tile__detail', text: tile.detail }),
];

const modeTile = (tile: Tile): HTMLElement =>
  h('div', { className: 'tile tile--mode', attrs: { role: 'note' } }, tileContent(tile));

interface ActionView {
  readonly button: HTMLButtonElement;
  readonly update: (state: State) => void;
}

const actionView = (tile: ActionTile, session: Session): ActionView => {
  const fill = h('span', { className: 'tile__charge' });
  const status = h('span', { className: 'tile__status' });
  const button = h(
    'button',
    {
      className: 'tile tile--action',
      attrs: { type: 'button' },
      onClick: () => {
        queueInput(session, tile.kind, 0, 0, 0);
      },
    },
    [fill, ...tileContent(tile), status],
  );
  let shown = -1;
  return {
    button,
    update: (state) => {
      const charge = Math.max(0, tile.charge(state));
      if (charge === shown) return;
      shown = charge;
      button.disabled = charge < 1;
      status.textContent = state.tick < ACT_TICK ? 'at 6 PM' : '';
      fill.style.transform = `scaleX(${String(charge)})`;
    },
  };
};

const listenBar = (session: Session): HTMLButtonElement => {
  const button = h(
    'button',
    { className: 'bottom-bar bottom-bar--listen', attrs: { type: 'button' } },
    [
      h('span', { className: 'bottom-bar__ring' }),
      icon('ear'),
      h('span', { className: 'bottom-bar__label', text: 'Actually Listen' }),
    ],
  );
  const release = (): void => {
    if (!button.classList.contains('is-holding')) return;
    button.classList.remove('is-holding');
    queueInput(session, InputKind.ListenUp, 0, 0, 0);
  };
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    button.classList.add('is-holding');
    queueInput(session, InputKind.ListenDown, 0, 0, 0);
  });
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  return button;
};

interface BottomBar {
  readonly element: HTMLElement;
  readonly update: (state: State) => void;
}

const objectiveBar = (): BottomBar => {
  const progress = h('span', { className: 'bottom-bar__progress' });
  const element = h('div', { className: 'bottom-bar bottom-bar--objective' }, [
    h('span', { className: 'bottom-bar__label', text: 'Reach the arch before 9 PM' }),
    progress,
  ]);
  let shown = -1;
  return {
    element,
    update: (state) => {
      if (state.reached === shown) return;
      shown = state.reached;
      progress.textContent = `${countLabel(state.reached)} / ${countLabel(REACHED_QUOTA)}`;
    },
  };
};

const BOTTOM: Readonly<Record<Side, (session: Session) => BottomBar>> = {
  [Side.Agency]: (session) => ({ element: listenBar(session), update: () => undefined }),
  [Side.Cockroach]: objectiveBar,
};

export interface Controls {
  readonly element: HTMLElement;
  readonly trigger: () => void;
  readonly update: (state: State) => void;
}

export const createControls = (session: Session): Controls => {
  const { side } = session.state;
  const action = actionView(ACTION[side](session.state), session);
  const bottom = BOTTOM[side](session);
  const element = h('footer', { className: 'controls' }, [
    h('div', { className: 'controls__tiles' }, [modeTile(MODE[side]), action.button]),
    bottom.element,
  ]);
  return {
    element,
    trigger: () => {
      action.button.click();
    },
    update: (state) => {
      action.update(state);
      bottom.update(state);
    },
  };
};
