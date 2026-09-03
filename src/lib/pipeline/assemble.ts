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
export async function assembleFinalVideo(project: Project): Promise<string> {
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

function muxSceneClip(opts: {
  clipPath: string;
  audioPath: string;
  onScreenText?: string;
  outPath: string;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(opts.clipPath).input(opts.audioPath);

    if (opts.onScreenText) {
      const safeText = opts.onScreenText.replace(/'/g, "\\'").replace(/:/g, "\\:");
      command = command.videoFilters(
        `drawtext=text='${safeText}':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.4:boxborderw=20:x=(w-text_w)/2:y=h-140`
      );
    }

    command
      .outputOptions(["-shortest", "-c:v libx264", "-c:a aac", "-pix_fmt yuv420p"])
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
