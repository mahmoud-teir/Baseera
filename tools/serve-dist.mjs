// Minimal static server for the web export with the same rewrites as production hosting
// (clean URLs + runtime dynamic routes). Usage: node tools/serve-dist.mjs [port] [dir=dist]
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const port = Number(process.argv[2] ?? 4173);
const root = join(process.cwd(), process.argv[3] ?? 'dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml' };
const REWRITES = [
  [/^\/book\/[^/]+$/, '/book/[id].html'],
  [/^\/player\/[^/]+$/, '/player/[id].html'],
  [/^\/verify\/[^/]+$/, '/verify/[code].html'],
  // Lesson codes added after the planned outline (pre-rendered codes are served directly).
  [/^\/academy\/lesson\/[^/]+$/, '/academy/lesson/[code].html'],
  [/^\/lesson\/[^/]+\/(quiz|result|answers)$/, (m) => `/lesson/[code]/${m[1]}.html`],
  [/^\/khushu\/[^/]+$/, '/khushu/[code].html'],
];
const file = (p) => existsSync(p) && statSync(p).isFile();
createServer((req, res) => {
  let url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  for (const [re, to] of REWRITES) {
    const m = re.exec(url);
    if (m && !file(join(root, url + '.html'))) url = typeof to === 'function' ? to(m) : to;
  }
  let p = normalize(join(root, url));
  if (!p.startsWith(root)) return res.writeHead(403).end();
  if (!file(p)) p = file(p + '.html') ? p + '.html' : file(join(p, 'index.html')) ? join(p, 'index.html') : join(root, '+not-found.html');
  const status = p.endsWith('+not-found.html') && url !== '/+not-found' ? 404 : 200;
  res.writeHead(status, { 'Content-Type': TYPES[extname(p)] ?? 'application/octet-stream' });
  res.end(readFileSync(p));
}).listen(port, () => console.log(`serving dist on http://127.0.0.1:${port}`));
