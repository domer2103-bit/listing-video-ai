/**
 * Inworld AI client — text-to-speech narration.
 *
 * Confirmed against docs.inworld.ai (Nov 2026):
 *   POST https://api.inworld.ai/tts/v1/voice
 *   Authorization: Basic <INWORLD_API_KEY>  (the key itself is already the
 *   base64 credential Inworld issues — pass it through as-is, don't
 *   base64-encode it again)
 *
 * Response has no duration field, so we measure the actual saved audio
 * file with ffprobe rather than estimating from word count — a words/min
 * guess was off by up to ~2s per scene in testing, enough to pick too
 * short a kie.ai clip duration downstream.
 */

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import ffmpeg from "fluent-ffmpeg";

const INWORLD_API_BASE = process.env.INWORLD_API_BASE ?? "https://api.inworld.ai/tts/v1";
const DEFAULT_VOICE_ID = process.env.INWORLD_VOICE_ID ?? "Dennis";
const DEFAULT_MODEL_ID = process.env.INWORLD_MODEL_ID ?? "inworld-tts-1.5-max";

function getApiKey(): string {
  const key = process.env.INWORLD_API_KEY;
  if (!key) throw new Error("INWORLD_API_KEY is not set");
  return key;
}

export interface SynthesizeInput {
  text: string;
  voiceId?: string;
}

export interface SynthesizeResult {
  audioUrl: string;
  durationSec: number;
}

export async function synthesizeSpeech(input: SynthesizeInput): Promise<SynthesizeResult> {
  const res = await fetch(`${INWORLD_API_BASE}/voice`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: input.text.slice(0, 2000),
      voiceId: input.voiceId ?? DEFAULT_VOICE_ID,
      modelId: DEFAULT_MODEL_ID,
      audioConfig: {
        audioEncoding: "MP3",
        sampleRateHertz: 48000,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Inworld synth failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const audioBuffer = Buffer.from(data.audioContent, "base64");
  const audioUrl = await saveAudioBuffer(audioBuffer);
  const durationSec = await getAudioDurationSec(path.join(process.cwd(), "public", audioUrl));

  return { audioUrl, durationSec };
}

/** GET /voices to discover real voiceIds — useful for picking INWORLD_VOICE_ID. */
export async function listVoices(): Promise<Array<{ voiceId: string; displayName: string }>> {
  const res = await fetch(`${INWORLD_API_BASE}/voices`, {
    headers: { Authorization: `Basic ${getApiKey()}` },
  });
  if (!res.ok) {
    throw new Error(`Inworld list voices failed: ${res.status} ${await res.text()}`);
  }
  const { voices } = await res.json();
  return voices;
}

async function saveAudioBuffer(buffer: Buffer): Promise<string> {
  const dir = path.join(process.cwd(), "public", "media", "audio");
  await mkdir(dir, { recursive: true });
  const fileName = `${nanoid()}.mp3`;
  await writeFile(path.join(dir, fileName), buffer);
  return `/media/audio/${fileName}`;
}

function getAudioDurationSec(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      resolve(data.format.duration ?? 0);
    });
  });
}
