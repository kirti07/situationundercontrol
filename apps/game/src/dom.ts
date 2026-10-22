export const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text = '',
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
};

export const button = (className: string, text: string, onClick: () => void): HTMLButtonElement => {
  const node = el('button', className, text);
  node.type = 'button';
  node.addEventListener('click', onClick);
  return node;
};

export const image = (className: string, src: string, alt: string): HTMLImageElement => {
  const node = el('img', className);
  node.src = src;
  node.alt = alt;
  node.decoding = 'async';
  return node;
};
