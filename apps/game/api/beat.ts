import { handleBeat } from '../server/handlers.ts';
import { deps } from './_deps.ts';

export const POST = (request: Request): Promise<Response> => handleBeat(request, deps());
