import './styles/index.css';
import { requireElement } from './dom.ts';
import { createRouter, type ScreenFactory, type ScreenLoaders } from './router.ts';
import { frontScreen } from './screens/front.ts';
import { sideFromQuery } from './ui/share.ts';

const loadPlay = (): Promise<ScreenFactory<'play'>> =>
  import('./screens/play.ts').then((module) => module.playScreen);

const loadRoster = (): Promise<ScreenFactory<'roster'>> =>
  import('./screens/roster.ts').then((module) => module.rosterScreen);

const loaders: ScreenLoaders = {
  front: () => Promise.resolve(frontScreen),
  roster: loadRoster,
  howto: () => import('./screens/howto.ts').then((module) => module.howtoScreen),
  play: loadPlay,
  result: () => import('./screens/result.ts').then((module) => module.resultScreen),
};

const whenIdle = (task: () => void): void => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(task);
    return;
  }
  setTimeout(task, 1000);
};

const navigate = createRouter(requireElement('#app', HTMLElement), loaders);
navigate('front', { invited: sideFromQuery(window.location.search) });
whenIdle(() => void Promise.all([loadPlay(), loadRoster()]));
