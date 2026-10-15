// Minimal static file server rooted at the project, so pages load the local
// fonts, images and node_modules over http (Chromium blocks fonts on file://).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = normalize(join(fileURLToPath(import.meta.url), "..", ".."));

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
  ".svg": "image/svg+xml", ".woff2": "font/woff2", ".wav": "audio/wav",
};

export function serve(port = 0) {
  const server = createServer(async (req, res) => {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)));
    if (!path.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    try {
      const file = (await stat(path)).isDirectory() ? join(path, "index.html") : path;
      const body = await readFile(file);
      res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () =>
    resolve({ server, url: `http://127.0.0.1:${server.address().port}` })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { url } = await serve(Number(process.argv[2] || 8123));
  console.log(`serving ${ROOT} at ${url}`);
}
