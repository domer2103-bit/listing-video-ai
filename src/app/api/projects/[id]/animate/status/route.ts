import { NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/store";
import { pollSceneVideoJob } from "@/lib/pipeline/animateScene";

/** Polls kie.ai for each scene's pending job and pulls down finished clips
 * (concatenating the satellite shot's Remotion descent with its kie.ai
 * orbit clip once that job lands). Call this repeatedly (e.g. every few
 * seconds) from the client until project.status === "animated". */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (!project.scenes?.length || !project.listing) {
    return NextResponse.json({ error: "Project has no scenes" }, { status: 400 });
  }

  await Promise.all(
    project.scenes.map(async (scene) => {
      try {
        await pollSceneVideoJob(scene, project.listing!);
      } catch {
        // A network error while polling (or downloading/concatenating the
        // finished clip) doesn't mean the kie.ai job failed — it may have
        // already succeeded server-side. Leave status as "processing" so
        // the next poll retries instead of permanently failing (and
        // needlessly re-billing) a scene that actually finished fine.
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
