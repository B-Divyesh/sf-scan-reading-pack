import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..', 'dist');
const port = Number(process.env.PORT || 4173);
const staticConfig = JSON.parse(await readFile(resolve(root, 'staticwebapp.config.json'), 'utf8'));
const headers = staticConfig.globalHeaders;
const types = {
  '.avif': 'image/avif', '.css': 'text/css; charset=utf-8', '.gz': 'application/gzip', '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp', '.woff2': 'font/woff2',
};

function requestedFile(pathname) {
  if (pathname === '/') return { file: 'index.html', status: 200 };
  if (['/demo', '/demo/', '/privacy', '/privacy/', '/terms', '/terms/'].includes(pathname)) return { file: `${pathname.split('/')[1]}/index.html`, status: 200 };
  return { file: pathname.slice(1), status: 200 };
}

createServer(async (request, response) => {
  const pathname = new URL(request.url || '/', `http://${request.headers.host}`).pathname;
  let target = requestedFile(pathname);
  let file = resolve(root, target.file);
  if (!file.startsWith(`${root}${sep}`) && file !== resolve(root, 'index.html')) target = { file: '404.html', status: 404 };
  else {
    try {
      if (!(await stat(file)).isFile()) target = { file: '404.html', status: 404 };
    } catch {
      target = { file: '404.html', status: 404 };
    }
  }
  file = resolve(root, target.file);
  const immutable = /^\/(?:assets|fonts|icons|ocr|tessdata)\//.test(pathname);
  response.writeHead(target.status, {
    ...headers,
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate',
    'Content-Type': types[extname(file)] || 'application/octet-stream',
  });
  if (request.method === 'HEAD') return response.end();
  response.end(await readFile(file));
}).listen(port, '127.0.0.1', () => console.log(`Production-policy preview at http://127.0.0.1:${port}`));
