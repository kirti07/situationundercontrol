import { InputKind, Side, swarmOf, type State } from '@suc/sim';
import { audioEngine } from '../audio/engine.ts';
import type { RunSummary } from '../content/endings.ts';
import { clockLabel } from '../content/format.ts';
import { CHARACTERS } from '../content/roster.ts';
import { SIDE_CLASS } from '../content/sides.ts';
import { h } from '../dom.ts';
import { todaysEdition } from '../edition.ts';
import { bindKeys, type KeyBindings } from '../input/keyboard.ts';
import { bindPointers, type PointerHandlers } from '../input/pointer.ts';
import { createCaptionStrip } from '../play/caption-strip.ts';
import { createCaptionDirector } from '../play/captions.ts';
import { createGagDirector } from '../play/gags.ts';
import { createControls } from '../play/controls.ts';
import { createHaptics } from '../play/haptics.ts';
import { createHud } from '../play/hud.ts';
import { createLoop } from '../play/loop.ts';
import { createMomentOverlay } from '../play/moments/overlay.ts';
import { createPauseOverlay } from '../play/pause.ts';
import { createRails } from '../play/rails.ts';
import { advanceSession, createSession, queueInput, type Session } from '../play/session.ts';
import { soundToggle, vibrationSettings } from '../play/settings.ts';
import { createSoundDirector } from '../play/sound.ts';
import { createSteerer } from '../play/steer.ts';
import { loadArt } from '../render/art.ts';
import { createCanvasRenderer } from '../render/canvas.ts';
import type { Navigate, PlayParams, ScreenFactory } from '../router.ts';
import { flag } from '../storage.ts';

const RESULT_DELAY_MS = 900;
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

const ANSWER_KEYS = ['1', '2'] as const;

const SIDE_KEYS: Readonly<Record<Side, (session: Session) => KeyBindings>> = {
  [Side.Agency]: () => ({}),
  [Side.Cockroach]: (session) => ({
    ...Object.fromEntries(
      ANSWER_KEYS.map((key, option) => [
        key,
        () => {
          queueInput(session, InputKind.Answer, 0, option, 0);
        },
      ]),
    ),
  }),
};

const summarise = (state: State, edition: number): RunSummary => ({
  side: state.side,
  edition,
  endReason: state.endReason,
  endTick: state.endTick,
  control: state.control,
  reached: state.reached,
  smashes: state.smashes,
  became: state.became,
  swarm: swarmOf(state),
  peakSympathy: state.peakSympathy,
  momentsWon: state.moment.won,
  momentsClosed: state.moment.closed,
});

interface PlayView {
  readonly element: HTMLElement;
  readonly stage: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly session: Session;
  readonly params: PlayParams;
  readonly navigate: Navigate;
}

const start = async (view: PlayView, signal: AbortSignal): Promise<void> => {
  const { session, canvas, stage, element, params, navigate } = view;
  const art = await loadArt();
  if (signal.aborted) return;
  const audio = audioEngine();
  audio.setMuted(flag('muted'));
  audio.setRunning(true);
  const haptics = createHaptics(!flag('noVibration'));
  const sound = createSoundDirector(session.state, audio, haptics);
  const hud = createHud(session.state, [soundToggle(audio)]);
  const strip = createCaptionStrip(session.state);
  const controls = createControls(session);
  const moments = createMomentOverlay(session);
  const rails = createRails(session.state, session.edition);
  const director = createCaptionDirector(session.state);
  const gags = createGagDirector(params.side, session.edition);
  const renderer = createCanvasRenderer(canvas, {
    art,
    labels: { power: CHARACTERS[params.character].power },
    reducedMotion: () => reducedMotion.matches,
    side: params.side,
  });
  const caption = (line: string | null): void => {
    if (line === null) return;
    strip.show(line);
    rails.log(line, clockLabel(session.state.tick));
  };
  const loop = createLoop({
    tick: () => {
      const running = advanceSession(session);
      renderer.ingest(session.state, performance.now());
      sound.observe(session.state);
      caption(director.observe(session.state) ?? gags.observe(session.state));
      return running;
    },
    frame: (alpha, now) => {
      renderer.draw(session.state, alpha, now);
      hud.update(session.state);
      controls.update(session.state);
      moments.update(session.state);
      rails.update(session.state);
    },
    finished: () => {
      window.setTimeout(() => {
        navigate('result', { play: params, run: summarise(session.state, session.edition) });
      }, RESULT_DELAY_MS);
    },
  });
  const setRunning = (running: boolean): void => {
    loop.setRunning(running);
    audio.setRunning(running);
  };
  const overlay = createPauseOverlay(
    setRunning,
    () => {
      navigate('front', { invited: null });
    },
    vibrationSettings(haptics),
  );
  hud.onPause(overlay.pause);
  stage.append(hud.element, moments.element, strip.element, controls.element, overlay.element);
  element.prepend(rails.left);
  element.append(rails.right);
  stage.classList.remove('is-loading');
  const resizeObserver = new ResizeObserver(renderer.resize);
  resizeObserver.observe(canvas);
  stage.addEventListener('pointerdown', audio.unlock, { signal, capture: true });
  document.addEventListener('keydown', audio.unlock, { signal });
  bindPointers(canvas, POINTER_HANDLERS[params.side](session), signal);
  bindKeys(
    {
      ...SIDE_KEYS[params.side](session),
      p: overlay.pause,
      P: overlay.pause,
      Escape: overlay.pause,
      ' ': controls.trigger,
    },
    signal,
  );
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.visibilityState === 'hidden') overlay.pause();
    },
    { signal },
  );
  signal.addEventListener('abort', () => {
    loop.stop();
    audio.release();
    overlay.dispose();
    resizeObserver.disconnect();
  });
  caption(director.observe(session.state));
  loop.start();
};

export const playScreen: ScreenFactory<'play'> = (params, navigate) => {
  const edition = todaysEdition();
  const session = createSession({ seed: edition.seed, ...params }, edition.number);
  const canvas = h('canvas', {
    className: 'stage__field',
    attrs: { 'aria-label': 'Kartavya Path at night' },
  });
  const stage = h('div', { className: 'stage is-loading' }, [canvas]);
  const element = h(
    'main',
    { className: `screen screen--night play play--${SIDE_CLASS[params.side]}` },
    [stage],
  );
  const controller = new AbortController();
  queueMicrotask(() => {
    void start({ element, stage, canvas, session, params, navigate }, controller.signal);
  });
  return {
    element,
    unmount: () => {
      controller.abort();
    },
  };
};
