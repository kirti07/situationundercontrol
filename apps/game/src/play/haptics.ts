export interface Haptics {
  readonly buzz: (ms: number) => void;
  readonly setEnabled: (enabled: boolean) => void;
}

export const hapticsSupported = (): boolean => 'vibrate' in navigator;

export const createHaptics = (enabled: boolean): Haptics => {
  let on = enabled;
  return {
    buzz: (ms) => {
      if (!on || ms === 0 || !hapticsSupported()) return;
      navigator.vibrate(ms);
    },
    setEnabled: (value) => {
      on = value;
    },
  };
};
