import { requireElement } from './dom.ts';
import { createRouter, type ScreenFactory, type ScreenLoaders } from './router.ts';
import { frontScreen } from './screens/front.ts';

const loadPlay = (): Promise<ScreenFactory<'play'>> =>
  import('./screens/play.ts').then((module) => module.playScreen);

const whenIdle = (task: () => void): void => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(task);
    return;
  }
  setTimeout(task, 1000);
};

const loaders: ScreenLoaders = {
  front: () => Promise.resolve(frontScreen),
  play: loadPlay,
};

const navigate = createRouter(requireElement('#app', HTMLElement), loaders);
navigate('front', undefined);
whenIdle(() => void loadPlay());
