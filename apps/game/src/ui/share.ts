import { Side } from '@suc/sim';
import { SIDE_CLASS } from '../content/sides.ts';

export const ShareOutcome = { Shared: 'shared', Copied: 'copied', Failed: 'failed' } as const;
export type ShareOutcome = (typeof ShareOutcome)[keyof typeof ShareOutcome];

const SIDE_PARAM: Readonly<Record<Side, string>> = {
  [Side.Agency]: SIDE_CLASS[Side.Agency],
  [Side.Cockroach]: 'cockroach',
};

export const shareLink = (side: Side): string =>
  `${window.location.origin}/?side=${SIDE_PARAM[side]}`;

const copy = async (text: string): Promise<ShareOutcome> => {
  try {
    await navigator.clipboard.writeText(text);
    return ShareOutcome.Copied;
  } catch {
    return ShareOutcome.Failed;
  }
};

export const shareRun = async (side: Side, message: string): Promise<ShareOutcome> => {
  const url = shareLink(side);
  const data: ShareData = { title: 'Situation Under Control', text: message, url };
  if (!('share' in navigator) || !navigator.canShare(data)) return copy(`${message} ${url}`);
  try {
    await navigator.share(data);
    return ShareOutcome.Shared;
  } catch {
    return copy(`${message} ${url}`);
  }
};

const SIDES: readonly Side[] = [Side.Agency, Side.Cockroach];

export const sideFromQuery = (search: string): Side | null => {
  const value = new URLSearchParams(search).get('side');
  return SIDES.find((side) => SIDE_PARAM[side] === value) ?? null;
};
