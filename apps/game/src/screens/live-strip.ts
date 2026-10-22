import { el } from '../dom.ts';
import { fetchLive } from '../net/live.ts';
import { displayCount, type Live } from '../shared/live.ts';

const POLL_MS = 30_000;
const ROLL_MS = 600;

export interface LiveStrip {
  readonly node: HTMLElement;
  readonly stop: () => void;
}

const roll = (node: HTMLElement, from: number, to: number, k: number): void => {
  const start = performance.now();
  const frame = (now: number): void => {
    const t = Math.min(1, (now - start) / ROLL_MS);
    node.textContent = displayCount(Math.round(from + (to - from) * (1 - (1 - t) ** 3)), k);
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
};

export const liveStrip = (): LiveStrip => {
  const node = el('p', 'live');
  node.hidden = true;
  const roaches = el('strong', 'live__roach', '0');
  const agency = el('strong', 'live__agency', '0');
  const counts = el('span', 'live__counts');
  counts.append(roaches, ' cockroaches vs ', agency, ' agency');
  const quiet = el('span', 'live__quiet', 'Nobody’s marching yet. Be the first.');
  node.append(el('span', 'live__dot'), el('span', 'live__label', 'LIVE'), counts, quiet);
  let shown: Live = { on: true, cockroach: 0, agency: 0, k: 1 };
  const show = (live: Live | undefined): void => {
    node.hidden = live === undefined;
    if (live === undefined) return;
    const empty = live.cockroach + live.agency === 0;
    counts.hidden = empty;
    quiet.hidden = !empty;
    roll(roaches, shown.cockroach, live.cockroach, live.k);
    roll(agency, shown.agency, live.agency, live.k);
    shown = live;
  };
  const poll = (): void => {
    if (document.visibilityState === 'visible') void fetchLive().then(show);
  };
  poll();
  const timer = window.setInterval(poll, POLL_MS);
  return {
    node,
    stop: () => {
      window.clearInterval(timer);
    },
  };
};
