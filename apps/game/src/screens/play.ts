import { BLAME } from '../content/copy.ts';
import { LEVELS } from '../content/levels.ts';
import { type Ending, ENDINGS, type Item, roleOf, type Side } from '../content/roles.ts';
import { type Level, parseLevel } from '../core/level.ts';
import { type Carry, createRun, NEW_RUN } from '../core/state.ts';
import { type RunEvent, step } from '../core/step.ts';
import { el } from '../dom.ts';
import { createAudio, type Sound } from '../engine/audio.ts';
import { createControls } from '../engine/input.ts';
import { startLoop } from '../engine/loop.ts';
import { createRenderer } from '../engine/render.ts';
import { loadSprites } from '../engine/sprites.ts';
import type { ScreenFactory } from '../router.ts';
import { currentEdition } from '../net/edition.ts';
import { startPresence } from '../net/presence.ts';
import { load, recordScore, setMuted } from '../storage.ts';
import { createHud } from './hud.ts';
import { type Choice, clearSheet, endingSheet, pauseSheet } from './overlays.ts';

type Sheet = 'none' | 'pause' | 'result';
type Handlers = {
  readonly [K in RunEvent['kind']]?: (event: Extract<RunEvent, { kind: K }>) => void;
};

const SOUNDS: Readonly<Partial<Record<RunEvent['kind'], Sound>>> = {
  jump: 'jump',
  exitOpen: 'exitOpen',
  asleep: 'asleep',
  caught: 'caught',
  clear: 'clear',
  over: 'over',
  refill: 'refill',
  dozed: 'asleep',
};

const TICKER_MS = 3000;
const PROTEST_MS = 2600;

const PICKUP_SOUND: Readonly<Record<Item, Sound>> = {
  flag: 'collect',
  money: 'collect',
  roach: 'whack',
  story: 'news',
};

const joinedAt = (index: number, clean: boolean): number => 100 + index * 50 + (clean ? 50 : 0);

const KEYBOARD_HINT = '← → move · ↑ jump · P pause';

const levelsFor = (side: Side): Level[] => LEVELS.map((def) => parseLevel(def, side));

const seed = (): number => crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;

const isTouch = (): boolean => matchMedia('(pointer: coarse)').matches;

const touchControls = (): { root: HTMLElement; pad: HTMLElement; jump: HTMLElement } => {
  const root = el('div', 'touch');
  const pad = el('div', 'touch__pad');
  pad.append(el('span', 'touch__arrow', '◀'), el('span', 'touch__arrow', '▶'));
  const jump = el('div', 'touch__jump', 'A');
  root.append(pad, jump);
  return { root, pad, jump };
};

const rotateCard = (): HTMLElement => {
  const node = el('div', 'rotate');
  node.append(el('p', 'rotate__text', 'Turn your phone. The march is wide.'));
  return node;
};

export const playScreen: ScreenFactory<'play'> = (navigate, { side, character }) => {
  const role = roleOf(side, character);
  const levels = levelsFor(side);
  const [first] = levels;
  if (first === undefined) throw new Error(`No levels for ${side}`);
  let muted = load().muted;
  const audio = createAudio(muted);
  const controls = createControls();
  const hud = createHud(role, isTouch() ? '' : KEYBOARD_HINT);
  const root = el('section', 'play');
  const stage = el('div', 'play__stage');
  const canvas = el('canvas', 'play__canvas');
  const layer = el('div', 'play__layer');
  const ticker = el('p', 'ticker');
  const touch = touchControls();
  stage.append(canvas, ticker, layer);
  root.append(hud.top, stage, hud.bottom, touch.root, rotateCard());
  controls.bindTouch(touch.pad, touch.jump);
  const edition = currentEdition();
  const renderer = createRenderer(canvas, loadSprites(role.look), role, edition);

  let index = 0;
  let state = createRun(first, NEW_RUN, seed(), role.mods);
  let sheet: Sheet = 'none';
  let tickerTimer = 0;
  let protestTimer = 0;
  let march = 0;

  const show = (node: HTMLElement | undefined, kind: Sheet): void => {
    layer.replaceChildren(...(node === undefined ? [] : [node]));
    sheet = kind;
  };
  const start = (level: Level, carry: Carry): void => {
    state = createRun(level, carry, seed(), role.mods);
    renderer.snap(state);
    show(undefined, 'none');
  };
  const restart = (): void => {
    index = 0;
    march = 0;
    start(first, NEW_RUN);
  };
  const home: Choice = {
    label: 'Front page',
    act: () => {
      navigate('home');
    },
  };
  const finish = (ending: Ending): void => {
    const best = recordScore(side, state.score);
    const choices = [{ label: 'Play again', primary: true, act: restart }, home];
    show(endingSheet(state, ending, best, choices), 'result');
  };
  const breaking = (index: number): void => {
    const headlines = edition.stories;
    ticker.textContent = `BREAKING · ${headlines[index % headlines.length] ?? ''}`;
    ticker.dataset.on = 'true';
    window.clearTimeout(tickerTimer);
    tickerTimer = window.setTimeout(() => {
      ticker.dataset.on = 'false';
    }, TICKER_MS);
  };
  const won = (): Ending => {
    const ending = ENDINGS[side].won;
    if (side === 'agency') return ending;
    return {
      ...ending,
      caption: `${march.toLocaleString('en-IN')} marched to India Gate. ${ending.caption}`,
    };
  };
  const lost = (): Ending => {
    const ending = ENDINGS[side].lost;
    if (side === 'agency' || state.cause === undefined) return ending;
    return { ...ending, caption: BLAME[state.cause] };
  };
  const tally = (bonus: number): void => {
    const next = levels[index + 1];
    if (next === undefined) {
      finish(won());
      return;
    }
    const advance = (): void => {
      index += 1;
      start(next, { lives: state.lives, score: state.score });
    };
    const choices = [{ label: 'Next level', primary: true, act: advance }, home];
    show(
      clearSheet(state, bonus, role, choices, side === 'cockroach' ? march : undefined),
      'result',
    );
  };
  const onClear = (bonus: number): void => {
    if (side === 'agency') {
      tally(bonus);
      return;
    }
    march += joinedAt(index, state.caughtThisLevel === 0);
    renderer.protest();
    sheet = 'result';
    protestTimer = window.setTimeout(() => {
      tally(bonus);
    }, PROTEST_MS);
  };
  const picked = (pickup: number): void => {
    audio.play(PICKUP_SOUND[role.item]);
    const cell = state.level.collectibles[pickup];
    if (role.item === 'roach' && cell !== undefined) renderer.burst(cell, 'WHACK!');
    if (role.item === 'story') breaking(pickup);
  };
  const handlers: Handlers = {
    respawn: () => {
      renderer.snap(state);
    },
    clear: (event) => {
      onClear(event.bonus);
    },
    over: () => {
      finish(lost());
    },
    collect: (event) => {
      picked(event.index);
    },
  };
  const react = (event: RunEvent): void => {
    const sound = SOUNDS[event.kind];
    if (sound !== undefined) audio.play(sound);
    (handlers[event.kind] as ((event: RunEvent) => void) | undefined)?.(event);
  };
  const toggleSound = (): void => {
    muted = !muted;
    setMuted(muted);
    audio.setMuted(muted);
    showPause();
  };
  const togglePause = (): void => {
    if (sheet === 'result') return;
    if (sheet === 'pause') {
      show(undefined, 'none');
      return;
    }
    showPause();
  };
  const showPause = (): void => {
    const sound: Choice = { label: muted ? 'Sound on' : 'Sound off', act: toggleSound };
    show(pauseSheet([{ label: 'Resume', primary: true, act: togglePause }, sound, home]), 'pause');
  };
  controls.onPause(togglePause);

  const unlock = (): void => {
    audio.unlock();
  };
  root.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  const loop = startLoop(
    () => {
      if (sheet === 'none') step(state, controls.read()).forEach(react);
    },
    () => {
      renderer.draw(state);
      hud.update(state);
    },
  );
  const stopPresence = startPresence(side, () => sheet === 'none' && state.phase === 'play');
  const observer = new ResizeObserver(([entry]) => {
    if (entry !== undefined) renderer.resize(entry.contentRect.width, entry.contentRect.height);
  });
  observer.observe(stage);
  renderer.snap(state);

  return {
    root,
    dispose: () => {
      loop.stop();
      stopPresence();
      window.clearTimeout(tickerTimer);
      window.clearTimeout(protestTimer);
      controls.dispose();
      audio.close();
      observer.disconnect();
      window.removeEventListener('keydown', unlock);
    },
  };
};
