import current from './editions/current.json';

export interface Edition {
  readonly edition: number;
  readonly date: string;
  readonly burningIssues: readonly string[];
  readonly stories: readonly string[];
  readonly placards: readonly string[];
  readonly hazardTags: Readonly<Record<'fire' | 'river' | 'pothole' | 'smog', string>>;
}

const LIMITS = {
  labels: 6,
  labelLength: 14,
  stories: 9,
  storyLength: 32,
  placards: 6,
  placardLength: 16,
} as const;

const within = (items: unknown, count: number, length: number): items is string[] =>
  Array.isArray(items) &&
  items.length > 0 &&
  items.length <= count &&
  items.every((item) => typeof item === 'string' && item.length > 0 && item.length <= length);

const tagsFit = (tags: unknown): boolean =>
  typeof tags === 'object' &&
  tags !== null &&
  ['fire', 'river', 'pothole', 'smog'].every((key) =>
    within([(tags as Record<string, unknown>)[key]], 1, LIMITS.labelLength),
  );

export const isEdition = (value: unknown): value is Edition => {
  if (typeof value !== 'object' || value === null) return false;
  const edition = value as Partial<Edition>;
  return (
    typeof edition.edition === 'number' &&
    typeof edition.date === 'string' &&
    within(edition.burningIssues, LIMITS.labels, LIMITS.labelLength) &&
    within(edition.stories, LIMITS.stories, LIMITS.storyLength) &&
    within(edition.placards, LIMITS.placards, LIMITS.placardLength) &&
    tagsFit(edition.hazardTags)
  );
};

export const BUNDLED: Edition = current;
