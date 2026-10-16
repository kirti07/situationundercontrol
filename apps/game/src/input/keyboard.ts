export type KeyBindings = Readonly<Record<string, () => void>>;

export const bindKeys = (bindings: KeyBindings, signal: AbortSignal): void => {
  const onKey = (event: KeyboardEvent): void => {
    const action = bindings[event.key];
    if (!action || event.repeat) return;
    event.preventDefault();
    action();
  };
  window.addEventListener('keydown', onKey, { signal });
};
