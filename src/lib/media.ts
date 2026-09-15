import { mkdir, writeFile, readFile, rm } from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { nanoid } from "nanoid";
import ffmpeg from "fluent-ffmpeg";

const execFileAsync = promisify(execFile);

/** Downloads a remote file (e.g. a kie.ai result URL) into local storage
 * and returns the public path to serve it from. */
export async function downloadToMedia(remoteUrl: string, subdir: string, ext: string): Promise<string> {
  const res = await fetch(remoteUrl);
  if (!res.ok) throw new Error(`Failed to download ${remoteUrl}: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "media", subdir);
  await mkdir(dir, { recursive: true });

  const fileName = `${nanoid()}.${ext}`;
  await writeFile(path.join(dir, fileName), buffer);

  return `/media/${subdir}/${fileName}`;
}

export function getDurationSec(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      resolve(data.format.duration ?? 0);
    });
  });
}

/**
 * Grabs the actual last frame of a local video file as a JPEG buffer. Used
 * to chain AI video clips together seamlessly — e.g. a generation model's
 * "last frame" reference input is a loose guide, not a guarantee, so the
 * clip's real final frame can land at a visibly different framing than the
 * reference image. Extracting the true last frame and using it as the next
 * clip's starting image avoids that mismatch.
 */
export async function extractLastFrame(videoPath: string): Promise<Buffer> {
  const tmpPath = path.join(path.dirname(videoPath), `${nanoid()}.jpg`);
  // Seek to 1s before EOF, then let every remaining frame overwrite the
  // same output file (-update 1) — whatever's left when ffmpeg exits is
  // the last frame.
  await execFileAsync("ffmpeg", ["-y", "-sseof", "-1", "-i", videoPath, "-update", "1", "-q:v", "2", tmpPath]);
  const buffer = await readFile(tmpPath);
  await rm(tmpPath, { force: true });
  return buffer;
}

/**
 * Concatenates local video files that may not share the same resolution
 * (e.g. a Remotion render joined with a kie.ai clip) into one file, scaling
 * every input to a common size first. Re-encodes (not a stream copy) since
 * mismatched inputs can't just be byte-concatenated.
 */
export async function concatVideoClips(
  clipPaths: string[],
  outPath: string,
  size: { width: number; height: number; fps: number }
): Promise<void> {
  const filterSteps = clipPaths.map(
    (_, i) =>
      `[${i}:v]scale=${size.width}:${size.height}:force_original_aspect_ratio=increase,` +
      `crop=${size.width}:${size.height},setsar=1,fps=${size.fps}[v${i}]`
  );
  const concatInputs = clipPaths.map((_, i) => `[v${i}]`).join("");
  const filter = `${filterSteps.join(";")};${concatInputs}concat=n=${clipPaths.length}:v=1:a=0[outv]`;

  await mkdir(path.dirname(outPath), { recursive: true });

  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    for (const p of clipPaths) command.input(p);
    command
      .complexFilter(filter, ["outv"])
      .outputOptions(["-c:v", "libx264", "-pix_fmt", "yuv420p"])
      .output(outPath)
      .on("end", () => resolve())
      .on("error", reject)
      .run();
  });
}
