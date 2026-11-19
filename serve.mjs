// Local static server for dist/ on http://localhost:4174. Listens on both 127.0.0.1 and ::1 so
// "localhost" works whichever address the browser resolves it to; never exposed to the network.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'dist');
const port = Number(process.env.PORT) || 4174;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

const handler = async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path === '/') path = '/keybloom.html';
  const file = normalize(join(root, path));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
  }
};

let up = 0;
for (const host of ['127.0.0.1', '::1']) {
  const s = http.createServer(handler);
  s.on('error', (e) => console.error(`${host}: ${e.code}`));
  s.listen(port, host, () => {
    if (++up === 1) console.log(`Keybloom: http://localhost:${port}/`);
  });
}
