import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const originalPath = (req.headers['x-matched-path'] as string) || (req.headers['x-forwarded-uri'] as string);
    if (originalPath && originalPath.startsWith('/api')) {
      const queryIndex = (req.url || '').indexOf('?');
      const queryString = queryIndex !== -1 ? req.url!.slice(queryIndex) : '';
      req.url = originalPath.includes('?') ? originalPath : `${originalPath}${queryString}`;
    }

    const { default: server } = await import('../apps/api/src/server');
    await server.ready();

    await new Promise<void>((resolve, reject) => {
      res.on('finish', resolve);
      res.on('close', resolve);
      res.on('error', reject);
      server.server.emit('request', req, res);
    });
  } catch (err: any) {
    console.error('Serverless execution error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify(
          {
            error: 'Serverless execution error',
            name: err?.name,
            message: err?.message || String(err),
            stack: err?.stack,
          },
          null,
          2
        )
      );
    }
  }
}

