import { h } from '../dom.ts';
import { icon, type IconName } from './icons.ts';

export interface ToggleOptions {
  readonly className: string;
  readonly label: string;
  readonly on: IconName;
  readonly off: IconName;
  readonly pressed: boolean;
  readonly onChange: (pressed: boolean) => void;
}

export const createToggle = (options: ToggleOptions): HTMLButtonElement => {
  const button = h(
    'button',
    {
      className: `toggle ${options.className}`,
      attrs: { type: 'button', 'aria-pressed': String(options.pressed) },
    },
    [
      icon(options.on, 'icon toggle__on'),
      icon(options.off, 'icon toggle__off'),
      h('span', { className: 'toggle__label', text: options.label }),
    ],
  );
  button.addEventListener('click', () => {
    const pressed = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(pressed));
    options.onChange(pressed);
  });
  return button;
};
