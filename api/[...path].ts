import type { IncomingMessage, ServerResponse } from 'http';
import server from '../apps/api/src/server';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // If rewritten by Vercel, restore the original request path from headers
  const originalPath = (req.headers['x-matched-path'] as string) || (req.headers['x-forwarded-uri'] as string);
  if (originalPath && originalPath.startsWith('/api')) {
    const queryIndex = (req.url || '').indexOf('?');
    const queryString = queryIndex !== -1 ? req.url!.slice(queryIndex) : '';
    req.url = originalPath.includes('?') ? originalPath : `${originalPath}${queryString}`;
  }

  await server.ready();
  server.server.emit('request', req, res);
}
