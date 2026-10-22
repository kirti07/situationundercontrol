import { handleLive } from '../server/handlers.ts';
import { deps } from './_deps.ts';

export const GET = (): Promise<Response> => handleLive(deps());
