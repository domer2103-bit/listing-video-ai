// One-off generator for the /airbnb landing page's before/after room
// cards. Unlike the seller page's marketing assets (real Rightmove listing
// photos), we have no real Airbnb host photos to use — so these "before"
// stills are AI-generated (Google Nano Banana via kie.ai) to depict a
// relatable modern short-term-rental flat, distinct from the seller page's
// ultra-luxury mansion. The "after" clips are rendered through the same
// real production path (renderPhotoMotion / Remotion Lambda) used for
// actual customer videos — genuine app output, just on synthetic source
// photos instead of a real listing.
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

const KIE_API_KEY = process.env.KIE_API_KEY;
if (!KIE_API_KEY) throw new Error("KIE_API_KEY is not set");
const KIE_API_BASE = "https://api.kie.ai/api/v1";

const ROOMS = [
  {
    slug: "living-room",
    motion: "pan-right",
    prompt:
      "Photorealistic interior photo of a small modern Scandinavian-style living room in a city-center short-term-rental apartment. Cozy grey sofa, a wooden coffee table, a potted plant, warm natural daylight through a large window, minimalist decor, wide-angle real-estate photography style, no people, no text.",
  },
  {
    slug: "bedroom",
    motion: "slow-push-in",
    prompt:
      "Photorealistic interior photo of a bright, tidy modern bedroom in a short-term-rental apartment. Double bed with crisp white linen, two bedside lamps, a large window with soft daylight, a small potted plant, minimalist Scandinavian decor, wide-angle real-estate photography style, no people, no text.",
  },
  {
    slug: "kitchen",
    motion: "pan-right",
    prompt:
      "Photorealistic interior photo of a small modern open-plan kitchen in a city apartment. White cabinetry, wood countertop, hanging pendant light, a coffee machine and a bowl of fruit on the counter, warm natural light, minimalist real-estate photography style, no people, no text.",
  },
  {
    slug: "balcony",
    motion: "drone-rise",
    prompt:
      "Photorealistic photo of a small city apartment balcony at golden hour. A bistro table with two chairs, string lights, a few potted plants, a soft-focus city skyline in the background, warm evening light, real-estate photography style, no people, no text.",
  },
];

async function submitNanoBananaJob(prompt) {
  const res = await fetch(`${KIE_API_BASE}/jobs/createTask`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/nano-banana",
      input: { prompt, output_format: "jpeg", aspect_ratio: "16:9" },
    }),
  });
  if (!res.ok) throw new Error(`kie.ai createTask failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  if (data.code !== 200 || !data.data?.taskId) {
    throw new Error(`kie.ai createTask returned an error: ${JSON.stringify(data)}`);
  }
  return data.data.taskId;
}

async function pollNanoBananaJob(taskId) {
  for (let i = 0; i < 60; i++) {
    const res = await fetch(`${KIE_API_BASE}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${KIE_API_KEY}` },
    });
    if (!res.ok) throw new Error(`kie.ai recordInfo failed: ${res.status} ${await res.text()}`);
    const { data } = await res.json();
    if (data?.state === "success") {
      const parsed = JSON.parse(data.resultJson);
      return parsed.resultUrls[0];
    }
    if (data?.state === "fail") throw new Error(`kie.ai job failed: ${data.failMsg}`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`kie.ai job ${taskId} timed out`);
}

const outDir = path.join(projectRoot, "public", "media", "marketing");
await mkdir(outDir, { recursive: true });

for (const room of ROOMS) {
  process.stdout.write(`${room.slug}: generating image (nano-banana)... `);
  const taskId = await submitNanoBananaJob(room.prompt);
  const imageUrl = await pollNanoBananaJob(taskId);
  console.log("done ->", imageUrl);

  process.stdout.write(`${room.slug}: downloading before... `);
  const imgRes = await fetch(imageUrl);
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  const beforePath = path.join(outDir, `airbnb-before-${room.slug}.jpg`);
  await writeFile(beforePath, buffer);
  console.log("done");

  process.stdout.write(`${room.slug}: rendering after (${room.motion})... `);
  const clipUrl = await renderPhotoMotion({ imageUrl, durationSec: 5, motion: room.motion });
  const src = path.join(projectRoot, "public", clipUrl);
  const dest = path.join(outDir, `airbnb-after-${room.slug}.mp4`);
  await writeFile(dest, readFileSync(src));
  console.log("done");
}

console.log(`\nAirbnb marketing assets written to ${outDir}`);
