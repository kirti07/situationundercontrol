export interface ElementOptions {
  readonly className?: string;
  readonly text?: string;
  readonly attrs?: Readonly<Record<string, string>>;
  readonly onClick?: () => void;
}

const assertSafeAttribute = (name: string): void => {
  if (/^(on|style$|srcdoc$)/i.test(name)) throw new Error(`Refusing attribute ${name}`);
};

export const h = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElementOptions = {},
  children: readonly Node[] = [],
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  element.className = options.className ?? '';
  element.textContent = options.text ?? null;
  for (const [name, value] of Object.entries(options.attrs ?? {})) {
    assertSafeAttribute(name);
    element.setAttribute(name, value);
  }
  element.append(...children);
  if (options.onClick) element.addEventListener('click', options.onClick);
  return element;
};

export const requireElement = <T extends Element>(selector: string, type: new () => T): T => {
  const element = document.querySelector(selector);
  if (!(element instanceof type)) throw new Error(`Missing ${selector}`);
  return element;
};
