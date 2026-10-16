import { SIM_VERSION } from '@suc/sim';

const root = document.getElementById('app');

if (root) {
  const title = document.createElement('h1');
  title.className = 'masthead';
  title.textContent = 'Situation Under Control';
  title.dataset.simVersion = String(SIM_VERSION);
  root.append(title);
}
