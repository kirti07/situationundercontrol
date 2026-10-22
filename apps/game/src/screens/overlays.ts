import type { Ending, Role } from '../content/roles.ts';
import { SCORE } from '../content/tuning.ts';
import type { RunState } from '../core/state.ts';
import { button, el } from '../dom.ts';

export interface Choice {
  readonly label: string;
  readonly primary?: boolean;
  readonly act: () => void;
}

const panel = (kicker: string, headline: string, choices: readonly Choice[]): HTMLElement => {
  const node = el('div', 'sheet');
  const actions = el('div', 'sheet__actions');
  actions.append(
    ...choices.map((choice) =>
      button(choice.primary === true ? 'sheet__go' : 'sheet__alt', choice.label, choice.act),
    ),
  );
  node.append(el('p', 'sheet__kicker', kicker), el('h2', 'sheet__headline', headline), actions);
  return node;
};

const line = (label: string, value: string): HTMLElement => {
  const node = el('p', 'tally__line');
  node.append(el('span', '', label), el('span', 'tally__value', value));
  return node;
};

const score = (state: RunState): string => state.score.toLocaleString('en-IN');

export const clearSheet = (
  state: RunState,
  bonus: number,
  role: Role,
  choices: readonly Choice[],
  march?: number,
): HTMLElement => {
  const got = state.collected.filter(Boolean).length;
  const clean = state.caughtThisLevel === 0;
  const time = bonus - SCORE.clear - (clean ? SCORE.neverCaught : 0);
  const headline =
    march === undefined
      ? `${String(got)} ${role.clearLine}`
      : `${state.level.name} is now a point of protest.`;
  const node = panel(`LEVEL CLEAR · ${state.level.name}`, headline, choices);
  const tally = el('div', 'tally');
  tally.append(
    line(
      `${role.itemsName}  ${String(got)} × ${String(SCORE.collect)}`,
      String(got * SCORE.collect),
    ),
    line(role.exitLine, String(SCORE.clear)),
    line('Time bonus', String(time)),
    line('Never caught', clean ? String(SCORE.neverCaught) : '—'),
    line('Score', score(state)),
  );
  if (march !== undefined) tally.prepend(line('The march', march.toLocaleString('en-IN')));
  node.insertBefore(tally, node.lastChild);
  return node;
};

export const endingSheet = (
  state: RunState,
  ending: Ending,
  best: boolean,
  choices: readonly Choice[],
): HTMLElement => {
  const node = panel('TOMORROW’S FRONT PAGE', ending.headline, choices);
  const caption = best ? `${ending.caption} A new personal best.` : ending.caption;
  node.insertBefore(el('p', 'sheet__caption', `Score ${score(state)}. ${caption}`), node.lastChild);
  return node;
};

export const pauseSheet = (choices: readonly Choice[]): HTMLElement =>
  panel('PAUSED', 'Situation on hold', choices);
