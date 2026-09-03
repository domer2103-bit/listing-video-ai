import { NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/store";
import { submitImageToVideoJob } from "@/lib/clients/kie";
import { buildVideoPrompt } from "@/lib/pipeline/videoPrompt";

/** Kicks off a kie.ai animation job per scene. These run async — poll
 * GET /api/projects/[id]/animate/status to check progress. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (!project.scenes?.length || !project.listing) {
    return NextResponse.json({ error: "Project has no scenes yet — run /script first" }, { status: 400 });
  }

  project.status = "animating";
  await saveProject(project);

  try {
    await Promise.all(
      project.scenes.map(async (scene) => {
        const { jobId } = await submitImageToVideoJob({
          imageUrl: scene.sourceImageUrl,
          prompt: buildVideoPrompt(scene, project.listing!),
          durationSec: "5",
        });
        scene.videoJobId = jobId;
        scene.videoStatus = "processing";
      })
    );
    project.error = undefined;
  } catch (err) {
    project.status = "failed";
    project.error = err instanceof Error ? err.message : "Animation job submission failed";
  }

  await saveProject(project);
  return NextResponse.json({ project }, { status: project.status === "failed" ? 500 : 202 });
}
