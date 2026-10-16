const SVG = 'http://www.w3.org/2000/svg';

const PATHS = {
  pause: ['M9 5v14', 'M15 5v14'],
  roach: [
    'M12 6c-3.3 0-5 2.6-5 6.5S8.7 20 12 20s5-3.6 5-7.5S15.3 6 12 6Z',
    'M12 6V20',
    'M9.5 6.5 7 3',
    'M14.5 6.5 17 3',
    'M7.2 10H4',
    'M16.8 10H20',
    'M7 14H4',
    'M17 14h3',
  ],
  badge: ['M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z', 'M9 12l2 2 4-4'],
  stamp: ['M9 3h6v6l2 3H7l2-3V3Z', 'M5 15h14v3H5z', 'M5 21h14'],
  megaphone: ['M3 10v4h4l6 4V6L7 10H3Z', 'M16 9a4 4 0 0 1 0 6', 'M19 6a8 8 0 0 1 0 12'],
  sitIn: [
    'M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
    'M16 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
    'M3 20v-3a5 5 0 0 1 10 0v3',
    'M11 20v-3a5 5 0 0 1 10 0v3',
  ],
  ear: [
    'M6 8.5a6 6 0 1 1 12 0c0 4-3 5-3 8a3 3 0 0 1-6 0',
    'M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-1.5 2-1.5 3.5',
  ],
  share: [
    'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    'M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    'M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    'M8.6 13.5l6.8 4',
    'M15.4 6.5l-6.8 4',
  ],
  sound: ['M4 9v6h4l5 4V5L8 9H4Z', 'M16.5 8.5a5 5 0 0 1 0 7', 'M19 6a8.5 8.5 0 0 1 0 12'],
  soundOff: ['M4 9v6h4l5 4V5L8 9H4Z', 'M17 9.5l5 5', 'M22 9.5l-5 5'],
  vibrate: [
    'M9 3h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z',
    'M4 8v8',
    'M20 8v8',
  ],
  vibrateOff: [
    'M9 3h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z',
    'M3 3l18 18',
  ],
  arrow: ['M5 12h14', 'M13 6l6 6-6 6'],
  swap: ['M7 4 3 8l4 4', 'M3 8h14', 'M17 20l4-4-4-4', 'M21 16H7'],
  replay: ['M3 12a9 9 0 1 0 3-6.7', 'M3 4v5h5'],
  back: ['M19 12H5', 'M11 6l-6 6 6 6'],
  help: [
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
    'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7',
    'M12 17h.01',
  ],
} as const;

export type IconName = keyof typeof PATHS;

export const icon = (name: IconName, className = 'icon'): SVGSVGElement => {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  for (const d of PATHS[name]) {
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
};
