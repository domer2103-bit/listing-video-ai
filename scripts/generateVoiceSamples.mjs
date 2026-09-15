// Generates one short preview clip per curated narration voice, so the
// chat UI can offer a "listen before you choose" button. Run with
// `npm run voices:generate` after editing the CURATED_VOICES list in
// src/lib/voices.ts. Needs INWORLD_API_KEY (reads .env.local directly
// since this runs outside the Next.js server process).
import { readFileSync } from "fs";
import { mkdir, copyFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

const envPath = path.join(projectRoot, ".env.local");
for (const line of readFileSync(envPath, "utf-8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const { synthesizeSpeech } = await import(path.join(projectRoot, "src/lib/clients/inworld.ts"));
const { CURATED_VOICES, VOICE_SAMPLE_TEXT } = await import(path.join(projectRoot, "src/lib/voices.ts"));

const outDir = path.join(projectRoot, "public", "media", "voice-samples");
await mkdir(outDir, { recursive: true });

for (const voice of CURATED_VOICES) {
  process.stdout.write(`Generating sample for ${voice.id}... `);
  const { audioUrl } = await synthesizeSpeech({ text: VOICE_SAMPLE_TEXT, voiceId: voice.id });
  const sourcePath = path.join(projectRoot, "public", audioUrl);
  const destPath = path.join(outDir, `${voice.id}.mp3`);
  await copyFile(sourcePath, destPath);
  console.log("done");
}

console.log(`\nVoice samples written to ${outDir}`);
