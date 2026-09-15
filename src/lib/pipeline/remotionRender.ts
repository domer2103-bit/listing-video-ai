import { renderMediaOnLambda, getRenderProgress } from "@remotion/lambda-client";
import type { AwsRegion } from "@remotion/lambda-client";
import { CameraMotion } from "../types";
import { downloadToMedia } from "../media";

// Rendering runs on Remotion Lambda (AWS) rather than locally — a single
// VPS's CPU can't run more than ~2 renders at once without falling over
// (each one is a full headless Chromium + ffmpeg process), so every scene
// serializes into slow batches. Lambda renders every scene in parallel on
// its own instance instead, cutting a multi-minute animate step down to
// roughly the time of a single scene.
const region = (process.env.REMOTION_AWS_REGION ?? "eu-west-2") as AwsRegion;
const functionName = requireEnv("REMOTION_LAMBDA_FUNCTION_NAME");
const serveUrl = requireEnv("REMOTION_LAMBDA_SERVE_URL");
const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? "https://onlineviewing.co.uk";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set — Remotion Lambda rendering requires it`);
  return value;
}

/**
 * A scraped listing's photos are already full https:// URLs (Rightmove's
 * CDN, etc.), but user-uploaded photos are stored as app-relative paths
 * (e.g. "/media/uploads/xyz.jpg"). The Remotion composition runs on
 * Lambda, with no knowledge of this app's origin — a relative <Img src>
 * there resolves against the deployed Remotion *site* bundle (serveUrl),
 * not this app's live server, so it 404s ("Error loading image with
 * src"). Prefixing with the app's public origin fixes it for both cases.
 */
function resolvePublicImageUrl(url: string): string {
  return url.startsWith("/") ? `${publicBaseUrl}${url}` : url;
}

async function renderComposition(id: string, inputProps: Record<string, unknown>): Promise<string> {
  const { renderId, bucketName } = await renderMediaOnLambda({
    region,
    functionName,
    serveUrl,
    composition: id,
    inputProps,
    codec: "h264",
    // Fewer, larger chunks per render — a brand-new AWS account's default
    // Lambda concurrency limit is only 10, and each scene's own chunks
    // count against that same ceiling alongside every other scene
    // rendering at once. Revisit once the account's quota increase lands.
    framesPerLambda: 60,
  });

  while (true) {
    const progress = await getRenderProgress({ renderId, bucketName, functionName, region });

    if (progress.fatalErrorEncountered) {
      const message = progress.errors.map((e) => e.message).join("; ") || "Unknown Lambda render error";
      throw new Error(`Remotion Lambda render failed: ${message}`);
    }
    if (progress.done) {
      if (!progress.outputFile) throw new Error("Remotion Lambda render finished with no output file");
      return downloadToMedia(progress.outputFile, "video", "mp4");
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}

/** Renders a simple push-in zoom on a single static image (used for the
 * street-view establishing shot). */
export async function renderKenBurnsZoom(opts: { imageUrl: string; durationSec: number }): Promise<string> {
  return renderComposition("KenBurnsZoom", { image: resolvePublicImageUrl(opts.imageUrl), durationSec: opts.durationSec });
}

/** Renders Ken-Burns-style pan/zoom motion over a single listing photo,
 * covering whichever CameraMotion the scene planner picked. Used for
 * interior room shots instead of kie.ai — free, exact duration match, no
 * risk of AI hallucination on a real photo. */
export async function renderPhotoMotion(opts: {
  imageUrl: string;
  durationSec: number;
  motion: CameraMotion;
}): Promise<string> {
  return renderComposition("PhotoMotion", {
    image: resolvePublicImageUrl(opts.imageUrl),
    durationSec: opts.durationSec,
    motion: opts.motion,
  });
}
