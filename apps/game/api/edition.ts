import { handleEdition } from '../server/handlers.ts';
import { deps } from './_deps.ts';

export const GET = (): Promise<Response> => handleEdition(deps());
