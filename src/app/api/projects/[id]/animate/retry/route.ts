import { NextRequest, NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/store";
import { submitImageToVideoJob } from "@/lib/clients/kie";
import { buildVideoPrompt } from "@/lib/pipeline/videoPrompt";

/** Resubmits a single failed/pending scene to kie.ai, without re-submitting
 * (and re-billing) scenes that already succeeded. Body: { sceneId: string }. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (!project.scenes?.length || !project.listing) {
    return NextResponse.json({ error: "Project has no scenes yet" }, { status: 400 });
  }

  const { sceneId } = await request.json();
  const scene = project.scenes.find((s) => s.id === sceneId);
  if (!scene) {
    return NextResponse.json({ error: "Scene not found" }, { status: 404 });
  }

  try {
    const { jobId } = await submitImageToVideoJob({
      imageUrl: scene.sourceImageUrl,
      prompt: buildVideoPrompt(scene, project.listing),
      durationSec: "5",
    });
    scene.videoJobId = jobId;
    scene.videoStatus = "processing";
    scene.videoError = undefined;
    if (project.status === "failed") {
      project.status = "animating";
      project.error = undefined;
    }
  } catch (err) {
    scene.videoStatus = "failed";
    scene.videoError = err instanceof Error ? err.message : "Retry submission failed";
    await saveProject(project);
    return NextResponse.json({ project }, { status: 500 });
  }

  await saveProject(project);
  return NextResponse.json({ project }, { status: 202 });
}
