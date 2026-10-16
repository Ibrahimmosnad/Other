// Rasterize every logo SVG in logo/ to a PNG at the given scale (default 4x).
// Usage: node tools/rasterize.mjs [scale]
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "logo");
const scale = Number(process.argv[2] || 4);

for (const f of readdirSync(dir).filter((n) => n.endsWith(".svg"))) {
  const out = join(dir, f.replace(/\.svg$/, ".png"));
  await sharp(join(dir, f), { density: 72 * scale }).png().toFile(out);
  console.log("wrote", out);
}
