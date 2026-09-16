import { mkdir, writeFile, rm } from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import ffmpeg from "fluent-ffmpeg";
import { Project } from "../types";

const execFileAsync = promisify(execFile);

const MEDIA_DIR = path.join(process.cwd(), "public", "media");
const FINAL_DIR = path.join(MEDIA_DIR, "final");

/**
 * Stitches per-scene video clips + narration audio into one MP4:
 * for each scene, mux its clip with its narration track (looping/trimming
 * the clip to match narration length), burn in onScreenText, then concat
 * all scenes back to back.
 *
 * This is a first pass with ffmpeg directly. If you want branded lower
 * thirds, animated captions or a logo watermark, consider swapping this
 * step for Remotion (React-based video compositions) instead — much
 * easier to art-direct than ffmpeg filter chains, at the cost of an extra
 * render pipeline. Worth revisiting once the raw pipeline works end to end.
 */
const WATERMARK_TEXT = "Made with Online Viewing · onlineviewing.co.uk";

export async function assembleFinalVideo(
  project: Project,
  opts: { isFreeTier?: boolean } = {}
): Promise<string> {
  if (!project.scenes || project.scenes.length === 0) {
    throw new Error("Project has no scenes to assemble");
  }

  const workDir = path.join(MEDIA_DIR, "work", project.id);
  await mkdir(workDir, { recursive: true });
  await mkdir(FINAL_DIR, { recursive: true });

  const sortedScenes = [...project.scenes].sort((a, b) => a.order - b.order);
  const sceneClipPaths: string[] = [];
  const canDrawtext = await hasDrawtextFilter();

  for (const scene of sortedScenes) {
    if (!scene.videoClipUrl || !scene.narrationAudioUrl) {
      throw new Error(`Scene ${scene.id} is missing a video clip or narration track`);
    }

    const clipPath = toLocalPath(scene.videoClipUrl);
    const audioPath = toLocalPath(scene.narrationAudioUrl);
    const outPath = path.join(workDir, `scene-${scene.order}.mp4`);

    await muxSceneClip({
      clipPath,
      audioPath,
      onScreenText: canDrawtext ? scene.onScreenText : undefined,
      watermark: canDrawtext && opts.isFreeTier ? WATERMARK_TEXT : undefined,
      introSilenceSec: scene.introSilenceSec,
      outPath,
    });

    sceneClipPaths.push(outPath);
  }

  const concatListPath = path.join(workDir, "concat.txt");
  await writeFile(
    concatListPath,
    sceneClipPaths.map((p) => `file '${p}'`).join("\n"),
    "utf-8"
  );

  const finalPath = path.join(FINAL_DIR, `${project.id}.mp4`);
  await concatClips(concatListPath, finalPath);
  await rm(workDir, { recursive: true, force: true });

  return `/media/final/${project.id}.mp4`;
}

let drawtextSupportCache: Promise<boolean> | null = null;

/**
 * Homebrew's default ffmpeg build doesn't always include `drawtext` (needs
 * libfreetype/fontconfig at compile time). Check once per process and skip
 * on-screen text overlays gracefully instead of failing the whole assemble
 * step — narration + video still work fine without it.
 */
function hasDrawtextFilter(): Promise<boolean> {
  if (!drawtextSupportCache) {
    drawtextSupportCache = execFileAsync("ffmpeg", ["-filters"])
      .then(({ stdout }) => stdout.includes("drawtext"))
      .catch(() => false);
  }
  return drawtextSupportCache;
}

function toLocalPath(publicUrl: string): string {
  // publicUrl is e.g. "/media/audio/xyz.mp3" -> public/media/audio/xyz.mp3
  return path.join(process.cwd(), "public", publicUrl);
}

function getDurationSec(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      resolve(data.format.duration ?? 0);
    });
  });
}

/**
 * kie.ai only offers 5s or 10s clips, which doesn't always exactly match
 * narration length. Rather than trimming narration short with `-shortest`
 * (which cuts voiceover off mid-sentence when the clip is shorter than the
 * audio), freeze-extend the clip's last frame to cover the full narration,
 * then trim to the audio's exact length.
 *
 * `introSilenceSec` (satellite establishing shot only) delays narration
 * onset so it starts when the orbit footage begins instead of overlapping
 * the silent zoom-in — padding accounts for the delayed audio's later end.
 */
// ffmpeg's filtergraph mini-language: a backslash-escaped quote inside an
// already-open quoted string does NOT produce a literal apostrophe — it
// prematurely closes the string, leaving everything after it (commas,
// colons) parsed as filtergraph syntax instead of text. The documented
// technique is to close the quote, escape a literal quote outside it, then
// reopen: '...'\''...'
function escapeDrawtext(text: string): string {
  return text.replace(/'/g, "'\\''").replace(/:/g, "\\:");
}

async function muxSceneClip(opts: {
  clipPath: string;
  audioPath: string;
  onScreenText?: string;
  /** Free-tier-only brand credit, burned into the bottom-right corner —
   * small and semi-transparent so it doesn't compete with the caption
   * (bottom-center, much larger) or the footage itself. */
  watermark?: string;
  introSilenceSec?: number;
  outPath: string;
}): Promise<void> {
  const [videoDur, audioDur] = await Promise.all([
    getDurationSec(opts.clipPath),
    getDurationSec(opts.audioPath),
  ]);
  const delaySec = opts.introSilenceSec ?? 0;
  const audioEndSec = delaySec + audioDur;
  const padSec = Math.max(0, audioEndSec - videoDur + 0.2);

  return new Promise((resolve, reject) => {
    let command = ffmpeg(opts.clipPath).input(opts.audioPath);

    const videoFilters: string[] = [];
    if (padSec > 0) {
      videoFilters.push(`tpad=stop_mode=clone:stop_duration=${padSec.toFixed(2)}`);
    }
    if (opts.onScreenText) {
      const safeText = escapeDrawtext(opts.onScreenText);
      videoFilters.push(
        `drawtext=text='${safeText}':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.4:boxborderw=20:x=(w-text_w)/2:y=h-140`
      );
    }
    if (opts.watermark) {
      const safeWatermark = escapeDrawtext(opts.watermark);
      videoFilters.push(
        `drawtext=text='${safeWatermark}':fontcolor=white@0.7:fontsize=20:x=w-text_w-20:y=h-40`
      );
    }
    if (videoFilters.length > 0) {
      command = command.videoFilters(videoFilters);
    }

    if (delaySec > 0) {
      command = command.audioFilters([`adelay=${Math.round(delaySec * 1000)}:all=1`]);
    }

    command
      .outputOptions([
        // Explicit stream mapping is required: Remotion embeds a silent
        // stereo audio track in its renders even with no <Audio> in the
        // composition, and without -map, ffmpeg's automatic stream
        // selection prefers the higher channel-count stream — silently
        // picking that dead track over the real (mono) narration.
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-shortest",
        "-c:v libx264",
        "-c:a aac",
        "-pix_fmt yuv420p",
      ])
      .output(opts.outPath)
      .on("end", () => resolve())
      .on("error", reject)
      .run();
  });
}

function concatClips(concatListPath: string, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(concatListPath)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions(["-c copy"])
      .output(outPath)
      .on("end", () => resolve())
      .on("error", reject)
      .run();
  });
}
