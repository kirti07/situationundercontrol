import {
  CONTROL_START,
  REACHED_QUOTA,
  Side,
  swarmOf,
  SYMPATHY_SCALE,
  TICKS_PER_MINUTE,
  type State,
} from '@suc/sim';
import { h } from '../dom.ts';
import { clockLabel, countLabel } from '../content/format.ts';
import { CHARACTERS, SIDE_NAMES } from '../content/roster.ts';

interface Meter {
  readonly label: string;
  readonly text: (state: State) => string;
  readonly fill: (state: State) => number;
}

const PRIMARY: Readonly<Record<Side, Meter>> = {
  [Side.Agency]: {
    label: 'Control',
    text: (state) => `${String(state.control)}%`,
    fill: (state) => state.control / CONTROL_START,
  },
  [Side.Cockroach]: {
    label: 'Reached',
    text: (state) => `${countLabel(state.reached)} · swarm ${countLabel(swarmOf(state))}`,
    fill: (state) => Math.min(1, state.reached / REACHED_QUOTA),
  },
};

const SYMPATHY: Meter = {
  label: 'Public sympathy',
  text: (state) => `${String(Math.floor(state.sympathy / SYMPATHY_SCALE))}%`,
  fill: (state) => state.sympathy / (100 * SYMPATHY_SCALE),
};

interface MeterView {
  readonly element: HTMLElement;
  readonly update: (state: State) => void;
}

const meterView = (meter: Meter, modifier: string): MeterView => {
  const value = h('span', { className: 'meter__value' });
  const bar = h('span', { className: 'meter__fill' });
  const element = h('div', { className: `meter meter--${modifier}` }, [
    h('span', { className: 'meter__label', text: meter.label }),
    value,
    h('span', { className: 'meter__track' }, [bar]),
  ]);
  let shown = '';
  return {
    element,
    update: (state) => {
      const text = meter.text(state);
      if (text === shown) return;
      shown = text;
      value.textContent = text;
      bar.style.transform = `scaleX(${String(meter.fill(state))})`;
    },
  };
};

export interface Hud {
  readonly element: HTMLElement;
  readonly update: (state: State) => void;
  readonly onPause: (handler: () => void) => void;
}

export const createHud = (state: State): Hud => {
  const clock = h('span', { className: 'hud__clock' });
  const primary = meterView(PRIMARY[state.side], 'primary');
  const sympathy = meterView(SYMPATHY, 'sympathy');
  const kicker = `${SIDE_NAMES[state.side]} · ${CHARACTERS[state.character].name}`;
  const pause = h('button', {
    className: 'hud__pause',
    text: 'Pause',
    attrs: { type: 'button', 'aria-label': 'Pause' },
  });
  const element = h('header', { className: 'hud' }, [
    pause,
    h('span', { className: 'hud__kicker', text: kicker }),
    clock,
    primary.element,
    sympathy.element,
  ]);
  let shownMinute = -1;
  return {
    element,
    onPause: (handler) => {
      pause.addEventListener('click', handler);
    },
    update: (current) => {
      primary.update(current);
      sympathy.update(current);
      const minute = Math.floor(current.tick / TICKS_PER_MINUTE);
      if (minute === shownMinute) return;
      shownMinute = minute;
      clock.textContent = clockLabel(current.tick);
    },
  };
};
