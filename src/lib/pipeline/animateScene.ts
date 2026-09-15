import { Scene, ListingData } from "../types";
import { submitImageToVideoJob, getVideoJobStatus, uploadImageToKie } from "../clients/kie";
import { submitVeoZoomJob, getVeoJobStatus } from "../clients/veo";
import { downloadToMedia, concatVideoClips, extractLastFrame, getDurationSec } from "../media";
import { buildSatelliteOrbitPrompt, buildEarthZoomPrompt } from "./videoPrompt";
import { renderKenBurnsZoom, renderPhotoMotion } from "./remotionRender";
import { buildSatelliteImageUrlAtZoom } from "../clients/googleMaps";
import { mkdir } from "fs/promises";
import { nanoid } from "nanoid";
import path from "path";

/** kie.ai only offers 5s/10s Kling clips — 5s is the natural length for
 * the property-orbit close-up. */
const ORBIT_DURATION_SEC = 5;
/** Veo3 only accepts 4, 6 or 8 second durations. */
const VEO_DURATIONS = [4, 6, 8] as const;

function pickVeoDuration(targetSec: number): (typeof VEO_DURATIONS)[number] {
  return VEO_DURATIONS.find((d) => d >= targetSec) ?? 8;
}

/**
 * Kicks off (or synchronously finishes, for Remotion-only scenes) animation
 * for one scene.
 *
 * - Satellite establishing shot: a Veo3 first/last-frame zoom from a
 *   whole-earth view down to a close-up satellite view (anchoring both
 *   endpoints keeps it from hallucinating, unlike Kling's open-ended
 *   "zoom in"). The kie.ai (Kling) orbit job is deferred until that
 *   finishes — Veo treats its "last frame" input as a loose reference, not
 *   a guarantee, so the clip can land at a visibly different framing than
 *   the reference image. Starting the orbit from the zoom clip's *actual*
 *   last frame (extracted and re-uploaded) instead of the original
 *   reference image keeps the cut seamless. See `pollSceneVideoJob`.
 * - Street-view establishing shot: a simple Remotion push-in, no AI needed.
 * - Interior shots: Remotion Ken-Burns pan/zoom over the listing photo,
 *   matching whichever CameraMotion the scene planner picked. No AI
 *   generation — free, exact duration match, nothing to hallucinate on a
 *   real photo.
 *
 * options.allowAiEstablishingShot gates the paid Veo3+Kling satellite path
 * by plan (see plans.ts) — when false, a satellite establishing shot falls
 * back to the same free Remotion Ken Burns zoom as the street-view case.
 */
export async function animateScene(
  scene: Scene,
  listing: ListingData,
  options: { allowAiEstablishingShot: boolean } = { allowAiEstablishingShot: true }
): Promise<void> {
  if (scene.kind === "establishing" && listing.location) {
    if (scene.establishingView === "satellite" && options.allowAiEstablishingShot) {
      const zoomDurationSec = pickVeoDuration(
        Math.max(4, (scene.narrationDurationSec ?? 7) - ORBIT_DURATION_SEC)
      );

      const { jobId: zoomJobId } = await submitVeoZoomJob({
        firstFrameUrl: buildSatelliteImageUrlAtZoom(listing.location, 2),
        lastFrameUrl: scene.sourceImageUrl,
        prompt: buildEarthZoomPrompt(listing),
        durationSec: zoomDurationSec,
      });

      scene.zoomJobId = zoomJobId;
      scene.videoJobId = undefined;
      scene.zoomClipUrl = undefined;
      scene.orbitClipUrl = undefined;
      scene.videoStatus = "processing";
      return;
    }

    scene.videoClipUrl = await renderKenBurnsZoom({
      imageUrl: scene.sourceImageUrl,
      durationSec: scene.narrationDurationSec ?? 6,
    });
    scene.videoStatus = "ready";
    return;
  }

  scene.videoClipUrl = await renderPhotoMotion({
    imageUrl: scene.sourceImageUrl,
    durationSec: scene.narrationDurationSec ?? 6,
    motion: scene.cameraMotion,
  });
  scene.videoStatus = "ready";
}

async function pollHybridSatelliteScene(scene: Scene, listing: ListingData): Promise<void> {
  // Stage 1: waiting on the Veo zoom job.
  if (scene.zoomJobId && !scene.zoomClipUrl) {
    const zoomResult = await getVeoJobStatus(scene.zoomJobId);
    if (zoomResult.status === "failed") {
      scene.videoStatus = "failed";
      scene.videoError = zoomResult.error;
      return;
    }
    if (zoomResult.status !== "ready" || !zoomResult.videoUrl) return;

    scene.zoomClipUrl = await downloadToMedia(zoomResult.videoUrl, "video", "mp4");
    // Real rendered duration, not the requested one — Veo doesn't always
    // land exactly on the requested length. Used to delay narration onset
    // at assemble time so it starts when the orbit begins, not the silent
    // zoom-in.
    scene.introSilenceSec = await getDurationSec(path.join(process.cwd(), "public", scene.zoomClipUrl));
  }

  // Stage 2: zoom clip is downloaded but the orbit job hasn't been
  // submitted yet — kept as its own gate (not folded into stage 1) so a
  // failure here (e.g. the upload step) can retry on the next poll instead
  // of getting stuck forever behind an already-set zoomClipUrl.
  if (scene.zoomClipUrl && !scene.videoJobId && !scene.orbitClipUrl) {
    // Kick off the orbit from the zoom clip's actual last frame (not the
    // original reference image) so the cut lands at the same framing.
    const zoomClipPath = path.join(process.cwd(), "public", scene.zoomClipUrl);
    const lastFrame = await extractLastFrame(zoomClipPath);
    const { url: lastFrameUrl } = await uploadImageToKie(lastFrame, `${nanoid()}.jpg`);

    const { jobId: orbitJobId } = await submitImageToVideoJob({
      imageUrl: lastFrameUrl,
      prompt: buildSatelliteOrbitPrompt(listing),
      durationSec: "5",
    });
    scene.videoJobId = orbitJobId;
    return;
  }

  // Stage 3: waiting on the kie.ai orbit job.
  if (scene.videoJobId && !scene.orbitClipUrl) {
    const orbitResult = await getVideoJobStatus(scene.videoJobId);
    if (orbitResult.status === "failed") {
      scene.videoStatus = "failed";
      scene.videoError = orbitResult.error;
      return;
    }
    if (orbitResult.status === "ready" && orbitResult.videoUrl) {
      scene.orbitClipUrl = await downloadToMedia(orbitResult.videoUrl, "video", "mp4");
    }
  }

  if (!scene.zoomClipUrl || !scene.orbitClipUrl) return;

  const outDir = path.join(process.cwd(), "public", "media", "video");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `${nanoid()}.mp4`);

  await concatVideoClips(
    [path.join(process.cwd(), "public", scene.zoomClipUrl), path.join(process.cwd(), "public", scene.orbitClipUrl)],
    outPath,
    { width: 1920, height: 1080, fps: 30 }
  );

  scene.videoClipUrl = `/media/video/${path.basename(outPath)}`;
  scene.zoomJobId = undefined;
  scene.zoomClipUrl = undefined;
  scene.orbitClipUrl = undefined;
  scene.videoStatus = "ready";
}

/** Polls a scene's pending job(s) and pulls down finished clips. The
 * satellite establishing shot chains two jobs (zoom, then orbit) and only
 * resolves once both are ready; everything else has a single job. */
export async function pollSceneVideoJob(scene: Scene, listing: ListingData): Promise<void> {
  if (scene.videoStatus !== "processing") return;

  if (scene.kind === "establishing" && scene.establishingView === "satellite") {
    await pollHybridSatelliteScene(scene, listing);
    return;
  }

  if (!scene.videoJobId) return;

  const result = await getVideoJobStatus(scene.videoJobId);
  if (result.status === "failed") {
    scene.videoStatus = "failed";
    scene.videoError = result.error;
    return;
  }
  if (result.status !== "ready" || !result.videoUrl) return;

  scene.videoClipUrl = await downloadToMedia(result.videoUrl, "video", "mp4");
  scene.videoStatus = "ready";
}
