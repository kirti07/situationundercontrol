import { InputKind, Side } from '@suc/sim';
import { ENDINGS } from '../content/endings.ts';
import { h } from '../dom.ts';
import { todaysEdition } from '../edition.ts';
import { bindKeys } from '../input/keyboard.ts';
import { bindPointers, type PointerHandlers } from '../input/pointer.ts';
import { createControls, type Controls } from '../play/controls.ts';
import { createHud, type Hud } from '../play/hud.ts';
import { createLoop } from '../play/loop.ts';
import { createPauseOverlay, type PauseOverlay } from '../play/pause.ts';
import { advanceSession, createSession, queueInput, type Session } from '../play/session.ts';
import { createSteerer } from '../play/steer.ts';
import { createCanvasRenderer } from '../render/canvas.ts';
import type { Navigate, PlayParams, ScreenFactory } from '../router.ts';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const ignore = (): void => undefined;

const POINTER_HANDLERS: Readonly<Record<Side, (session: Session) => PointerHandlers>> = {
  [Side.Agency]: (session) => ({
    press: (slot, point) => {
      queueInput(session, InputKind.Tap, slot, point.x, point.y);
    },
    move: ignore,
    release: ignore,
  }),
  [Side.Cockroach]: createSteerer,
};

interface PlayView {
  readonly element: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly session: Session;
  readonly params: PlayParams;
  readonly navigate: Navigate;
}

const endCard = (view: PlayView): HTMLElement => {
  const copy = ENDINGS[view.session.state.endReason];
  return h('div', { className: 'end-card' }, [
    h('h2', { className: 'end-card__headline', text: copy.headline }),
    h('p', { className: 'end-card__score', text: copy.score(view.session.state) }),
    h('button', {
      className: 'button button--primary',
      text: 'Play again',
      onClick: () => {
        view.navigate('play', view.params);
      },
    }),
    h('button', {
      className: 'button',
      text: 'Front page',
      onClick: () => {
        view.navigate('front', undefined);
      },
    }),
  ]);
};

const bindInputs = (
  view: PlayView,
  overlay: PauseOverlay,
  controls: Controls,
  signal: AbortSignal,
): void => {
  bindPointers(view.canvas, POINTER_HANDLERS[view.params.side](view.session), signal);
  bindKeys(
    { p: overlay.pause, P: overlay.pause, Escape: overlay.pause, ' ': controls.trigger },
    signal,
  );
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.visibilityState === 'hidden') overlay.pause();
    },
    { signal },
  );
};

const start = (view: PlayView, hud: Hud, controls: Controls, signal: AbortSignal): void => {
  const { session, canvas, element } = view;
  const renderer = createCanvasRenderer(canvas, { reducedMotion: () => reducedMotion.matches });
  const loop = createLoop({
    tick: () => {
      const running = advanceSession(session);
      renderer.ingest(session.state, performance.now());
      return running;
    },
    frame: (alpha, now) => {
      renderer.draw(session.state, alpha, now);
      hud.update(session.state);
      controls.update(session.state);
    },
    finished: () => {
      element.append(endCard(view));
    },
  });
  const overlay = createPauseOverlay(loop.setRunning);
  hud.onPause(overlay.pause);
  element.append(overlay.element);
  const resizeObserver = new ResizeObserver(renderer.resize);
  resizeObserver.observe(canvas);
  bindInputs(view, overlay, controls, signal);
  signal.addEventListener('abort', () => {
    loop.stop();
    overlay.dispose();
    resizeObserver.disconnect();
  });
  loop.start();
};

export const playScreen: ScreenFactory<'play'> = (params, navigate) => {
  const edition = todaysEdition();
  const session = createSession({ seed: edition.seed, ...params }, edition.number);
  const canvas = h('canvas', {
    className: 'play__field',
    attrs: { 'aria-label': 'Kartavya Path' },
  });
  const hud = createHud(session.state);
  const controls = createControls(session);
  const element = h('section', { className: 'play' }, [canvas, hud.element, controls.element]);
  const controller = new AbortController();
  queueMicrotask(() => {
    start({ element, canvas, session, params, navigate }, hud, controls, controller.signal);
  });
  return {
    element,
    unmount: () => {
      controller.abort();
    },
  };
};
