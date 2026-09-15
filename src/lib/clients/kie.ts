/**
 * kie.ai client — Kling image-to-video generation.
 *
 * Confirmed against docs.kie.ai (Nov 2026):
 *   - Create task: POST /api/v1/jobs/createTask
 *   - Status:      GET  /api/v1/jobs/recordInfo?taskId=...
 * https://docs.kie.ai/market/kling/image-to-video
 * https://docs.kie.ai/market/common/get-task-detail
 */

const KIE_API_BASE = process.env.KIE_API_BASE ?? "https://api.kie.ai/api/v1";
const KIE_MODEL = process.env.KIE_MODEL ?? "kling-2.6/image-to-video";

function getApiKey(): string {
  const key = process.env.KIE_API_KEY;
  if (!key) throw new Error("KIE_API_KEY is not set");
  return key;
}

/**
 * Uploads a local file (e.g. an extracted video frame) to kie.ai's file
 * host and returns a public URL — Kling's image_urls field only accepts
 * "uploaded file URLs, not file content", no base64/data URIs.
 * https://docs.kie.ai/file-upload-api/upload-file-stream
 *
 * Despite what the docs page says, this endpoint 404s on api.kie.ai — the
 * actual host (confirmed by testing) is kieai.redpandaai.co.
 */
export async function uploadImageToKie(buffer: Buffer, fileName: string): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: "image/jpeg" }), fileName);
  form.append("uploadPath", "online-viewing");
  form.append("fileName", fileName);

  const res = await fetch("https://kieai.redpandaai.co/api/file-stream-upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${getApiKey()}` },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`kie.ai file upload failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  if (!data.success || !data.data?.downloadUrl) {
    throw new Error(`kie.ai file upload returned an error: ${JSON.stringify(data)}`);
  }

  return { url: data.data.downloadUrl };
}

export interface SubmitVideoJobInput {
  imageUrl: string;
  prompt: string;
  /** kie.ai's Kling endpoint only accepts "5" or "10". */
  durationSec?: "5" | "10";
}

export interface SubmitVideoJobResult {
  jobId: string;
}

export async function submitImageToVideoJob(
  input: SubmitVideoJobInput
): Promise<SubmitVideoJobResult> {
  const res = await fetch(`${KIE_API_BASE}/jobs/createTask`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: KIE_MODEL,
      input: {
        prompt: input.prompt.slice(0, 1000),
        image_urls: [input.imageUrl],
        sound: false,
        duration: input.durationSec ?? "5",
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`kie.ai createTask failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  if (data.code !== 200 || !data.data?.taskId) {
    throw new Error(`kie.ai createTask returned an error: ${JSON.stringify(data)}`);
  }

  return { jobId: data.data.taskId };
}

export type VideoJobStatus = "queued" | "processing" | "ready" | "failed";

export interface VideoJobResult {
  status: VideoJobStatus;
  videoUrl?: string;
  error?: string;
}

const STATE_MAP: Record<string, VideoJobStatus> = {
  waiting: "queued",
  queuing: "queued",
  generating: "processing",
  success: "ready",
  fail: "failed",
};

export async function getVideoJobStatus(jobId: string): Promise<VideoJobResult> {
  const res = await fetch(`${KIE_API_BASE}/jobs/recordInfo?taskId=${encodeURIComponent(jobId)}`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });

  if (!res.ok) {
    throw new Error(`kie.ai recordInfo failed: ${res.status} ${await res.text()}`);
  }

  const { data } = await res.json();
  const status = STATE_MAP[data?.state as string] ?? "queued";

  let videoUrl: string | undefined;
  if (status === "ready" && data?.resultJson) {
    const parsed = JSON.parse(data.resultJson);
    videoUrl = parsed.resultUrls?.[0];
  }

  return {
    status,
    videoUrl,
    error: data?.failMsg,
  };
}
