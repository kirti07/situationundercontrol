import type { AudioEngine } from '../audio/engine.ts';
import { flag, setFlag } from '../storage.ts';
import { createToggle } from '../ui/toggle.ts';
import { hapticsSupported, type Haptics } from './haptics.ts';

export const soundToggle = (audio: AudioEngine): HTMLButtonElement =>
  createToggle({
    className: 'hud__button',
    label: 'Sound',
    on: 'sound',
    off: 'soundOff',
    pressed: !flag('muted'),
    onChange: (on) => {
      setFlag('muted', !on);
      audio.setMuted(!on);
    },
  });

export const vibrationSettings = (haptics: Haptics): readonly HTMLElement[] =>
  hapticsSupported()
    ? [
        createToggle({
          className: 'link-button link-button--light pause__toggle',
          label: 'Vibration',
          on: 'vibrate',
          off: 'vibrateOff',
          pressed: !flag('noVibration'),
          onChange: (on) => {
            setFlag('noVibration', !on);
            haptics.setEnabled(on);
          },
        }),
      ]
    : [];
