// Capture every frame of the film to out/frames/0000.png ... 0899.png.
//   node tools/render-frames.mjs [workers] [--from N] [--to N]
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT, serve } from "./serve.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? Number(args[i + 1]) : d; };
const workers = Number(args.find((a) => /^\d+$/.test(a)) || 3);
const FPS = 30, DURATION = 30;
const from = opt("from", 0), to = opt("to", FPS * DURATION - 1);
const outDir = join(ROOT, "out", "frames");
mkdirSync(outDir, { recursive: true });

const { server, url } = await serve();
const browser = await chromium.launch();
const t0 = Date.now();
let done = 0;
const total = to - from + 1;

async function worker(k) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.log(`[w${k}] pageerror:`, e.message));
  page.on("console", (m) => m.type() === "error" && console.log(`[w${k}] console:`, m.text()));
  await page.goto(`${url}/comp/index.html`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
  const stage = page.locator("#stage");
  for (let f = from + k; f <= to; f += workers) {
    await page.evaluate((t) => window.seek(t), f / FPS);
    await stage.screenshot({ path: join(outDir, `${String(f).padStart(4, "0")}.png`) });
    done++;
    if (done % 60 === 0) console.log(`${done}/${total} frames, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  await page.close();
}

await Promise.all(Array.from({ length: workers }, (_, k) => worker(k)));
await browser.close();
server.close();
console.log(`captured ${total} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
