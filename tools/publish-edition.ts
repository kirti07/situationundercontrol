import { BUNDLED, isEdition } from '../apps/game/src/content/edition.ts';

const required = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value === '') throw new Error(`${name} is not set`);
  return value;
};

if (!isEdition(BUNDLED)) throw new Error('The bundled edition fails its own limits');

const url = new URL(`https://api.vercel.com/v1/edge-config/${required('EDGE_CONFIG_ID')}/items`);
const team = process.env.VERCEL_TEAM_ID;
if (team !== undefined && team !== '') url.searchParams.set('teamId', team);

const response = await fetch(url, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${required('VERCEL_TOKEN')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ items: [{ operation: 'upsert', key: 'edition', value: BUNDLED }] }),
});

if (!response.ok) throw new Error(`Edge Config answered ${String(response.status)}`);
console.log(`Edition ${String(BUNDLED.edition)} is live`);
