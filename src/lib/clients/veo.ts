/**
 * kie.ai Veo 3.1 client — image-to-video with first/last-frame
 * interpolation. Used for the earth-zoom descent (whole-earth view ->
 * close-up satellite view): giving the model both endpoints constrains it
 * to a coherent interpolation instead of open-ended "zoom in" on one image,
 * which is what caused Kling to hallucinate warped geometry.
 *
 * Confirmed against docs.kie.ai (Nov 2026):
 *   Generate: POST /api/v1/veo/generate
 *   Status:   GET  /api/v1/veo/record-info?taskId=...
 * Different endpoint shape than the unified /jobs/createTask flow the
 * Kling client (kie.ts) uses — Veo has its own dedicated routes.
 */

const KIE_API_BASE = process.env.KIE_API_BASE ?? "https://api.kie.ai/api/v1";

function getApiKey(): string {
  const key = process.env.KIE_API_KEY;
  if (!key) throw new Error("KIE_API_KEY is not set");
  return key;
}

export interface SubmitVeoZoomJobInput {
  firstFrameUrl: string;
  lastFrameUrl: string;
  prompt: string;
  /** Veo3 only accepts 4, 6 or 8 seconds. */
  durationSec: 4 | 6 | 8;
}

export async function submitVeoZoomJob(input: SubmitVeoZoomJobInput): Promise<{ jobId: string }> {
  const res = await fetch(`${KIE_API_BASE}/veo/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: input.prompt,
      imageUrls: [input.firstFrameUrl, input.lastFrameUrl],
      model: "veo3_fast",
      generationType: "FIRST_AND_LAST_FRAMES_2_VIDEO",
      aspect_ratio: "Auto",
      duration: input.durationSec,
      resolution: "720p",
    }),
  });

  if (!res.ok) {
    throw new Error(`kie.ai Veo generate failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  if (data.code !== 200 || !data.data?.taskId) {
    throw new Error(`kie.ai Veo generate returned an error: ${JSON.stringify(data)}`);
  }

  return { jobId: data.data.taskId };
}

export type VeoJobStatus = "processing" | "ready" | "failed";

export interface VeoJobResult {
  status: VeoJobStatus;
  videoUrl?: string;
  error?: string;
}

export async function getVeoJobStatus(jobId: string): Promise<VeoJobResult> {
  const res = await fetch(`${KIE_API_BASE}/veo/record-info?taskId=${encodeURIComponent(jobId)}`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });

  if (!res.ok) {
    throw new Error(`kie.ai Veo record-info failed: ${res.status} ${await res.text()}`);
  }

  const { data } = await res.json();
  const flag = data?.successFlag;

  if (flag === 1) {
    // Docs say fullResultUrls is the canonical field, but in practice it
    // can come back null while resultUrls has the actual video URL.
    const videoUrl = data?.response?.fullResultUrls?.[0] ?? data?.response?.resultUrls?.[0];
    return { status: "ready", videoUrl };
  }
  if (flag === 2 || flag === 3) {
    return { status: "failed", error: data?.errorMessage ?? "Veo generation failed" };
  }
  return { status: "processing" };
}
