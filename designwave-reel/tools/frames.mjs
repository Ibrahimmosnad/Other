// Render chosen moments of the film to PNGs for review.
//   node tools/frames.mjs out_dir t1 t2 ... [--preview] [--safe]
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { serve } from "./serve.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith("--")).map((a) => a.slice(2));
const [outDir, ...times] = args.filter((a) => !a.startsWith("--"));
mkdirSync(outDir, { recursive: true });

const { server, url } = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && console.log("console:", m.text()));
page.on("pageerror", (e) => console.log("pageerror:", e.message));
page.on("requestfailed", (r) => console.log("failed:", r.url()));
await page.goto(`${url}/comp/index.html?${flags.join("&")}`);
await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
for (const t of times) {
  await page.evaluate((x) => window.seek(x), Number(t));
  const path = join(outDir, `t${Number(t).toFixed(2).padStart(5, "0")}.png`);
  await page.locator("#stage").screenshot({ path });
  console.log("wrote", path);
}
await browser.close();
server.close();
