import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

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
