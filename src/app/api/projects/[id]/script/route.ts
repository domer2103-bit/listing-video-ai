import { NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/store";
import { generateScenePlan } from "@/lib/pipeline/scenePlan";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (!project.listing) {
    return NextResponse.json({ error: "Project has no scraped listing yet" }, { status: 400 });
  }

  project.status = "scripting";
  await saveProject(project);

  try {
    project.scenes = await generateScenePlan(project.listing);
    project.status = "scripted";
    project.error = undefined;
  } catch (err) {
    project.status = "failed";
    project.error = err instanceof Error ? err.message : "Script generation failed";
  }

  await saveProject(project);
  return NextResponse.json({ project }, { status: project.status === "failed" ? 500 : 200 });
}
