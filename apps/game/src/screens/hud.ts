import { CAUGHT_LABEL } from '../content/copy.ts';
import type { Role } from '../content/roles.ts';
import { ENERGY } from '../content/tuning.ts';
import type { RunState } from '../core/state.ts';
import { el, image } from '../dom.ts';
import { lookImage } from '../engine/sprites.ts';

export interface Hud {
  readonly top: HTMLElement;
  readonly bottom: HTMLElement;
  readonly update: (state: RunState) => void;
}

const stat = (label: string): { node: HTMLElement; value: HTMLElement } => {
  const node = el('div', 'hud__stat');
  const value = el('span', 'hud__value');
  node.append(el('span', 'hud__label', label), value);
  return { node, value };
};

const setText = (node: HTMLElement, text: string): void => {
  if (node.textContent !== text) node.textContent = text;
};

const tally = (state: RunState): string =>
  `${String(state.collected.filter(Boolean).length)} / ${String(state.collected.length)}`;

const statusOf = (state: RunState, role: Role): { text: string; tone: string } => {
  if (state.phase === 'caught' && state.cause !== undefined) {
    return { text: `${CAUGHT_LABEL[state.cause]}!`, tone: 'alert' };
  }
  if (state.dozing > 0) return { text: 'DOZED OFF…', tone: 'alert' };
  if (state.exitOpen) return { text: role.exitOpen, tone: 'go' };
  return { text: `${role.goal} · ${tally(state)}`, tone: '' };
};

const energyMeter = (): { node: HTMLElement; fill: HTMLElement } => {
  const node = el('div', 'hud__stat');
  const track = el('span', 'hud__meter');
  const fill = el('span', 'hud__meter-fill');
  track.append(fill);
  node.append(el('span', 'hud__label', 'ENERGY'), track);
  return { node, fill };
};

export const createHud = (role: Role, hint: string): Hud => {
  const top = el('header', 'hud hud--top');
  const score = stat('SCORE');
  const level = stat('LEVEL');
  const lives = stat('LIVES');
  const items = stat(role.collects);
  const energy = energyMeter();
  top.append(score.node, level.node, lives.node, items.node);
  if (role.mods.energy) top.append(energy.node);
  const bottom = el('footer', 'hud hud--bottom');
  const status = el('p', 'hud__status');
  bottom.append(status, el('p', 'hud__hint', hint));
  const icon = lookImage(role.look);
  let shownLives = -1;
  return {
    top,
    bottom,
    update: (state) => {
      setText(score.value, String(state.score).padStart(6, '0'));
      setText(level.value, state.level.name);
      setText(items.value, tally(state));
      const { text, tone } = statusOf(state, role);
      setText(status, text);
      status.dataset.tone = tone;
      energy.fill.style.width = `${String(Math.round((state.energy / ENERGY.max) * 100))}%`;
      energy.fill.dataset.tired = String(state.energy < ENERGY.tiredBelow);
      if (state.lives === shownLives) return;
      shownLives = state.lives;
      lives.value.replaceChildren(
        ...Array.from({ length: Math.max(0, state.lives) }, () => image('hud__life', icon, '')),
      );
    },
  };
};
