// One-off generator for the landing page's before/after room cards.
// Downloads real listing photos as "before" stills and renders their
// Remotion Ken-Burns clips as "after" videos — all free (local render).
import { readFileSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

const envPath = path.join(projectRoot, ".env.local");
for (const line of readFileSync(envPath, "utf-8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const { renderPhotoMotion } = await import(path.join(projectRoot, "src/lib/pipeline/remotionRender.ts"));

const PAIRS = [
  { slug: "reception", url: "https://media.rightmove.co.uk/property-photo/d733c8eab/171185315/d733c8eabc748768699f429f5f560386.jpeg", motion: "pan-right" },
  { slug: "drawing-room", url: "https://media.rightmove.co.uk/property-photo/ee869d5ac/171185315/ee869d5ac5b7a8bb1b14abbc48c6eef5.jpeg", motion: "slow-push-in" },
  { slug: "kitchen", url: "https://media.rightmove.co.uk/property-photo/645a4620a/171185315/645a4620af1c2004b014ce5c26378047.jpeg", motion: "pan-right" },
  { slug: "roof-terrace", url: "https://media.rightmove.co.uk/property-photo/da57b3e7c/171185315/da57b3e7c4c2cbd64350b41b00164f4b.jpeg", motion: "drone-rise" },
  { slug: "exterior", url: "https://media.rightmove.co.uk/property-photo/20bd523bf/171185315/20bd523bff350af52b37a4b5d1ed6518.jpeg", motion: "orbit-right" },
];

const outDir = path.join(projectRoot, "public", "media", "marketing");
await mkdir(outDir, { recursive: true });

for (const pair of PAIRS) {
  process.stdout.write(`${pair.slug}: downloading before... `);
  const res = await fetch(pair.url);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(path.join(outDir, `before-${pair.slug}.jpg`), buffer);
  console.log("done");

  process.stdout.write(`${pair.slug}: rendering after (${pair.motion})... `);
  const clipUrl = await renderPhotoMotion({ imageUrl: pair.url, durationSec: 5, motion: pair.motion });
  const src = path.join(projectRoot, "public", clipUrl);
  const dest = path.join(outDir, `after-${pair.slug}.mp4`);
  await writeFile(dest, readFileSync(src));
  console.log("done");
}

console.log(`\nMarketing assets written to ${outDir}`);
