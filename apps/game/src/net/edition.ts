import { BUNDLED, type Edition, isEdition } from '../content/edition.ts';

const TIMEOUT_MS = 3000;
let current: Edition = BUNDLED;

export const currentEdition = (): Edition => current;

export const refreshEdition = async (): Promise<void> => {
  try {
    const response = await fetch('/api/edition', { signal: AbortSignal.timeout(TIMEOUT_MS) });
    const edition: unknown = response.ok ? await response.json() : undefined;
    if (isEdition(edition)) current = edition;
  } catch {
    return;
  }
};
