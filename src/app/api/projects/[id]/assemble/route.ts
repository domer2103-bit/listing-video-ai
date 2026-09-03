import { NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/store";
import { assembleFinalVideo } from "@/lib/pipeline/assemble";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.status !== "animated") {
    return NextResponse.json(
      { error: `Project isn't ready to assemble yet (status: ${project.status})` },
      { status: 400 }
    );
  }

  project.status = "assembling";
  await saveProject(project);

  try {
    project.finalVideoUrl = await assembleFinalVideo(project);
    project.status = "done";
    project.error = undefined;
  } catch (err) {
    project.status = "failed";
    project.error = err instanceof Error ? err.message : "Assembly failed";
  }

  await saveProject(project);
  return NextResponse.json({ project }, { status: project.status === "failed" ? 500 : 200 });
}
