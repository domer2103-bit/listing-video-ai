import { NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/store";
import { getVideoJobStatus } from "@/lib/clients/kie";
import { downloadToMedia } from "@/lib/media";

/** Polls kie.ai for each scene's job and pulls down finished clips.
 * Call this repeatedly (e.g. every few seconds) from the client until
 * project.status === "animated". */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (!project.scenes?.length) {
    return NextResponse.json({ error: "Project has no scenes" }, { status: 400 });
  }

  await Promise.all(
    project.scenes
      .filter((s) => s.videoJobId && s.videoStatus === "processing")
      .map(async (scene) => {
        try {
          const result = await getVideoJobStatus(scene.videoJobId!);
          if (result.status === "ready" && result.videoUrl) {
            scene.videoClipUrl = await downloadToMedia(result.videoUrl, "video", "mp4");
            scene.videoStatus = "ready";
          } else if (result.status === "failed") {
            scene.videoStatus = "failed";
            scene.videoError = result.error;
          }
        } catch (err) {
          scene.videoStatus = "failed";
          scene.videoError = err instanceof Error ? err.message : "Status check failed";
        }
      })
  );

  const allDone = project.scenes.every((s) => s.videoStatus === "ready" || s.videoStatus === "failed");
  if (allDone) {
    const anyFailed = project.scenes.some((s) => s.videoStatus === "failed");
    project.status = anyFailed ? "failed" : "animated";
    if (!anyFailed) project.error = undefined;
  }

  await saveProject(project);
  return NextResponse.json({ project });
}
