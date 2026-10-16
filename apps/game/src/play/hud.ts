import {
  CONTROL_START,
  LIGHTS_MINUTE,
  RUSH_MINUTE,
  Side,
  swarmOf,
  SYMPATHY_MAX,
  TICKS_PER_MINUTE,
  type State,
} from '@suc/sim';
import { clockLabel, countLabel, percentLabel } from '../content/format.ts';
import { CHARACTERS, SIDE_NAMES } from '../content/roster.ts';
import { SIDE_CLASS } from '../content/sides.ts';
import { h } from '../dom.ts';
import { icon } from '../ui/icons.ts';

const SWARM_SCALE = 600;

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
    label: 'Swarm',
    text: (state) => countLabel(swarmOf(state)),
    fill: (state) => Math.min(1, swarmOf(state) / SWARM_SCALE),
  },
};

const SYMPATHY_LABEL: Readonly<Record<Side, string>> = {
  [Side.Agency]: 'Public sympathy for roaches',
  [Side.Cockroach]: 'Public sympathy',
};

const KICKER: Readonly<Record<Side, (state: State) => string>> = {
  [Side.Agency]: (state) =>
    `${SIDE_NAMES[state.side]} · ${CHARACTERS[state.character].name} on duty`,
  [Side.Cockroach]: () => 'Cockroaches · the march',
};

const NEXT_BEAT: readonly (readonly [number, string])[] = [
  [LIGHTS_MINUTE, 'lights at 7'],
  [RUSH_MINUTE, 'rush at 8'],
  [Number.MAX_SAFE_INTEGER, 'edition at 9'],
];

const beatLabel = (minute: number): string =>
  NEXT_BEAT.find(([until]) => minute < until)?.[1] ?? '';

interface MeterView {
  readonly element: HTMLElement;
  readonly update: (state: State) => void;
}

const meterView = (
  label: string,
  meter: Pick<Meter, 'text' | 'fill'>,
  modifier: string,
): MeterView => {
  const value = h('span', { className: 'meter__value' });
  const bar = h('span', { className: 'meter__fill' });
  const element = h('div', { className: `meter meter--${modifier}` }, [
    h('span', { className: 'meter__label', text: label }),
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

export const createHud = (state: State, extras: readonly HTMLElement[]): Hud => {
  const clock = h('span', { className: 'hud__clock' });
  const beat = h('span', { className: 'hud__beat' });
  const side = SIDE_CLASS[state.side];
  const primary = meterView(PRIMARY[state.side].label, PRIMARY[state.side], `primary-${side}`);
  const sympathy = meterView(
    SYMPATHY_LABEL[state.side],
    {
      text: (current) => percentLabel(current.sympathy),
      fill: (current) => current.sympathy / SYMPATHY_MAX,
    },
    `sympathy-${side}`,
  );
  const pause = h(
    'button',
    { className: 'hud__button', attrs: { type: 'button', 'aria-label': 'Pause' } },
    [icon('pause')],
  );
  const element = h('header', { className: `hud hud--${side}` }, [
    pause,
    h('div', { className: 'hud__where' }, [
      h('span', { className: 'hud__kicker', text: KICKER[state.side](state) }),
      h('span', { className: 'hud__title', text: 'Kartavya Path' }),
    ]),
    h('div', { className: 'hud__time' }, [clock, beat]),
    ...extras,
    h('div', { className: 'hud__meters' }, [primary.element, sympathy.element]),
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
      beat.textContent = beatLabel(minute);
    },
  };
};
