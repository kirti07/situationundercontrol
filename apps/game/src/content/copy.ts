export const CAUGHT_LABEL = {
  patrol: 'JAILED',
  jail: 'JAILED',
  fire: 'SCORCHED',
  river: 'FOAMED',
  pothole: 'POTHOLED',
  smog: 'CHOKED',
  fall: 'FELL',
} as const;

const blamed = (what: string): string => `Officials blamed the cockroach, not ${what}.`;

export const BLAME: Readonly<Record<keyof typeof CAUGHT_LABEL, string>> = {
  patrol: 'Officials confirmed there were no protesters.',
  jail: 'Officials confirmed there were no protesters.',
  fire: blamed('the landfill fire'),
  river: blamed('the toxic foam'),
  pothole: blamed('the pothole'),
  smog: blamed('the air'),
  fall: blamed('the broken roads'),
};
