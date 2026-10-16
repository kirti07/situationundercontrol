import { Side, swarmOf, type State } from '@suc/sim';
import { countLabel, percentLabel } from '../content/format.ts';
import { HOW_TO } from '../content/howto.ts';
import { SIDE_CLASS } from '../content/sides.ts';
import { h } from '../dom.ts';
import { keyList } from '../ui/howto.ts';
import { editionDateLine } from '../ui/masthead.ts';

const LOG_LENGTH = 5;

interface StatRow {
  readonly label: string;
  readonly value: (state: State) => string;
}

const STATS: Readonly<Record<Side, readonly StatRow[]>> = {
  [Side.Agency]: [
    { label: 'Control', value: (state) => `${String(state.control)}%` },
    { label: 'Smashes', value: (state) => countLabel(state.smashes) },
    { label: 'Became', value: (state) => countLabel(state.became) },
    { label: 'On the path', value: (state) => countLabel(swarmOf(state)) },
    { label: 'Peak sympathy', value: (state) => percentLabel(state.peakSympathy) },
  ],
  [Side.Cockroach]: [
    { label: 'Reached', value: (state) => countLabel(state.reached) },
    { label: 'Swarm', value: (state) => countLabel(swarmOf(state)) },
    { label: 'Stamped', value: (state) => countLabel(state.smashes) },
    { label: 'Became', value: (state) => countLabel(state.became) },
    { label: 'Peak sympathy', value: (state) => percentLabel(state.peakSympathy) },
  ],
};

export interface Rails {
  readonly left: HTMLElement;
  readonly right: HTMLElement;
  readonly update: (state: State) => void;
  readonly log: (line: string, clock: string) => void;
}

export const createRails = (state: State, edition: number): Rails => {
  const howTo = HOW_TO[state.side];
  const left = h('aside', { className: `rail rail--left rail--${SIDE_CLASS[state.side]}` }, [
    h('p', { className: 'rail__masthead', text: 'Situation Under Control' }),
    editionDateLine(edition),
    h('h2', { className: 'rail__heading', text: "Tonight's orders" }),
    h(
      'ol',
      { className: 'rail__orders' },
      howTo.lines.map((line) => h('li', { text: line })),
    ),
    keyList(state.side),
  ]);
  const rows = STATS[state.side].map((row) => ({
    row,
    value: h('dd', { className: 'rail__value' }),
  }));
  const entries = h('ol', { className: 'rail__log', attrs: { 'aria-label': 'Captions so far' } });
  const right = h('aside', { className: 'rail rail--right' }, [
    h('h2', { className: 'rail__heading', text: 'Tonight so far' }),
    h(
      'dl',
      { className: 'rail__stats' },
      rows.map(({ row, value }) =>
        h('div', { className: 'rail__stat' }, [h('dt', { text: row.label }), value]),
      ),
    ),
    h('h2', { className: 'rail__heading', text: 'From the wire' }),
    entries,
  ]);
  return {
    left,
    right,
    update: (current) => {
      for (const { row, value } of rows) {
        const text = row.value(current);
        if (value.textContent !== text) value.textContent = text;
      }
    },
    log: (line, clock) => {
      entries.prepend(h('li', {}, [h('time', { text: clock }), h('span', { text: line })]));
      while (entries.children.length > LOG_LENGTH) entries.lastElementChild?.remove();
    },
  };
};
