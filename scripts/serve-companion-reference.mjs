import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const html = resolve(import.meta.dirname, '..', 'design', 'stitches-companion.html');
const assets = new Map([
  ['/hero-wrap-skirt.png', resolve(import.meta.dirname, '..', 'design', 'hero-wrap-skirt.png')],
  ['/card-utility-overshirt.png', resolve(import.meta.dirname, '..', 'design', 'card-utility-overshirt.png')],
]);
const server = createServer(async (req, res) => {
  try {
    const imagePath = assets.get(new URL(req.url, 'http://127.0.0.1').pathname);
    const data = await readFile(imagePath ?? html);
    res.writeHead(200, { 'Content-Type': imagePath ? 'image/png' : 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(data);
  } catch {
    res.writeHead(500).end('Reference unavailable');
  }
});
server.listen(4180, '127.0.0.1', () => console.log('Companion reference: http://127.0.0.1:4180'));
