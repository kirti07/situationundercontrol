import './styles/index.css';
import { refreshEdition } from './net/edition.ts';
import { createRouter, type Loaders } from './router.ts';
import { homeScreen } from './screens/home.ts';

const loaders: Loaders = {
  home: () => Promise.resolve(homeScreen),
  select: () => import('./screens/select.ts').then((module) => module.selectScreen),
  play: () => import('./screens/play.ts').then((module) => module.playScreen),
};

const host = document.getElementById('app');
void refreshEdition();
if (host !== null) createRouter(host, loaders)('home');
