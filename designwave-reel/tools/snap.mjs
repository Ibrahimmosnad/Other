// Screenshot every [data-snap] element of a page to assets/tex/<key>.png.
//   node tools/snap.mjs [page] [scale]
import { createRequire } from "node:module";
import { join } from "node:path";
import { ROOT, serve } from "./serve.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");

const page_ = process.argv[2] || "/comp/brand/touchpoints.html";
const scale = Number(process.argv[3] || 2);

const { server, url } = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: scale });
page.on("console", (m) => m.type() === "error" && console.log("console:", m.text()));
page.on("requestfailed", (r) => console.log("failed:", r.url()));
await page.goto(url + page_);
await page.waitForFunction(() => window.ready === true);
await page.waitForTimeout(300);
for (const el of await page.$$("[data-snap]")) {
  const key = await el.getAttribute("data-snap");
  const out = join(ROOT, "assets", "tex", `${key}.png`);
  await (await el.$(":scope > *")).screenshot({ path: out });
  console.log("wrote", out);
}
await browser.close();
server.close();
