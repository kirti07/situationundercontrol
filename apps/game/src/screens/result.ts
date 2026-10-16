import { Character, EndReason, Side } from '@suc/sim';
import roachArt from '../assets/art/roach-hero.webp';
import { ENDINGS, Theme, type EndingCopy, type RunSummary } from '../content/endings.ts';
import { editionDateline } from '../content/format.ts';
import { h } from '../dom.ts';
import type { Navigate, PlayParams, ScreenFactory } from '../router.ts';
import { flag, raiseFlag } from '../storage.ts';
import { icon } from '../ui/icons.ts';
import { dateline, masthead } from '../ui/masthead.ts';
import { shareRun, ShareOutcome } from '../ui/share.ts';

const CROWD_MAX = 90;
const CROWD_PER_ROACH = 400;

const SHARE_LABEL: Readonly<Record<ShareOutcome, string>> = {
  [ShareOutcome.Shared]: 'Shared',
  [ShareOutcome.Copied]: 'Copied. Paste it anywhere.',
  [ShareOutcome.Failed]: 'Could not share',
};

const SHARE_TEXT: Readonly<Record<Side, string>> = {
  [Side.Agency]: 'Share this front page',
  [Side.Cockroach]: '#MainBhiCockroach · Share',
};

const SIDE_FLAGS: Partial<Record<EndReason, 'seenOverrun' | 'foundListen'>> = {
  [EndReason.Overrun]: 'seenOverrun',
  [EndReason.Listened]: 'foundListen',
};

const crowd = (run: RunSummary): HTMLElement => {
  const count = Math.min(CROWD_MAX, Math.ceil(run.swarm / CROWD_PER_ROACH) + 20);
  const layer = h('div', { className: 'crowd', attrs: { 'aria-hidden': 'true' } });
  for (let i = 0; i < count; i += 1) {
    const roach = h('img', { className: 'crowd__roach', attrs: { src: roachArt, alt: '' } });
    roach.style.left = `${String((i * 37 + run.edition * 11) % 96)}%`;
    roach.style.top = `${String(18 + ((i * 53) % 74))}%`;
    roach.style.transform = `rotate(${String(((i * 29) % 30) - 15)}deg)`;
    layer.append(roach);
  }
  return layer;
};

const figure = (copy: EndingCopy, run: RunSummary): HTMLElement =>
  h('figure', { className: 'ink-panel result__figure' }, [
    h('div', { className: 'result__art' }, [
      h('img', { className: 'ink-panel__art', attrs: { src: copy.art, alt: 'India Gate' } }),
      ...(copy.crowd ? [crowd(run)] : []),
    ]),
    ...(copy.quote === ''
      ? []
      : [h('figcaption', { className: 'ink-panel__caption', text: copy.quote })]),
  ]);

const stats = (copy: EndingCopy, run: RunSummary): HTMLElement =>
  h(
    'dl',
    { className: 'stats' },
    copy
      .stats(run)
      .map((stat) =>
        h('div', { className: 'stats__item' }, [
          h('dd', { className: 'stats__value', text: stat.value }),
          h('dt', { className: 'stats__label', text: stat.label }),
        ]),
      ),
  );

const SWITCH_FROM: Readonly<Record<Side, (navigate: Navigate) => void>> = {
  [Side.Agency]: (navigate) => {
    navigate('play', { side: Side.Cockroach, character: Character.None });
  },
  [Side.Cockroach]: (navigate) => {
    navigate('roster', undefined);
  },
};

const actions = (
  copy: EndingCopy,
  run: RunSummary,
  play: PlayParams,
  navigate: Navigate,
): HTMLElement => {
  const shareLabel = h('span', { text: SHARE_TEXT[run.side] });
  const share = h(
    'button',
    {
      className: `cta cta--share cta--share-${copy.theme}`,
      attrs: { type: 'button' },
      onClick: () => {
        void shareRun(run.side, copy.share(run)).then((outcome) => {
          shareLabel.textContent = SHARE_LABEL[outcome];
        });
      },
    },
    [icon('share'), shareLabel],
  );
  return h('div', { className: 'result__actions' }, [
    share,
    h('div', { className: 'result__pair' }, [
      h(
        'button',
        {
          className: 'ghost-button',
          attrs: { type: 'button' },
          onClick: () => {
            SWITCH_FROM[run.side](navigate);
          },
        },
        [icon('swap'), h('span', { text: 'Switch sides' })],
      ),
      h(
        'button',
        {
          className: 'ghost-button',
          attrs: { type: 'button' },
          onClick: () => {
            navigate('play', play);
          },
        },
        [icon('replay'), h('span', { text: 'Play again' })],
      ),
    ]),
    h('button', {
      className: 'link-button result__home',
      attrs: { type: 'button' },
      text: 'Front page',
      onClick: () => {
        navigate('front', { invited: null });
      },
    }),
  ]);
};

const hint = (run: RunSummary): readonly HTMLElement[] =>
  run.endReason === EndReason.Overrun && !flag('foundListen')
    ? [
        h('p', { className: 'result__hint' }, [
          icon('ear'),
          h('span', { text: 'There was another button the whole time.' }),
        ]),
      ]
    : [];

const HEADER: Readonly<Record<Theme, (run: RunSummary) => readonly HTMLElement[]>> = {
  [Theme.Paper]: (run) => [
    dateline('Morning edition', editionDateline(run.edition + 1), 'Agency run', true),
    masthead('small'),
  ],
  [Theme.Night]: () => [],
};

export const resultScreen: ScreenFactory<'result'> = ({ play, run }, navigate) => {
  const copy = ENDINGS[run.endReason];
  const flagName = SIDE_FLAGS[run.endReason];
  if (flagName) raiseFlag(flagName);
  const element = h(
    'main',
    { className: `screen screen--${copy.theme} result result--${copy.theme}` },
    [
      ...HEADER[copy.theme](run),
      h('header', { className: 'result__head' }, [
        h('p', { className: 'kicker result__kicker', text: copy.kicker }),
        h('h1', { className: 'result__headline', text: copy.headline }),
        h('p', { className: 'result__dek', text: copy.dek(run) }),
      ]),
      figure(copy, run),
      h('footer', { className: 'result__foot' }, [
        stats(copy, run),
        actions(copy, run, play, navigate),
        ...hint(run),
      ]),
    ],
  );
  return { element, unmount: () => undefined };
};
