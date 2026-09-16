import { NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/store";
import { assembleFinalVideo } from "@/lib/pipeline/assemble";
import { getUser, maybeGrantReferralReward } from "@/lib/userStore";

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

  // Same "no email never hits a real flow, default permissive" reasoning as
  // the AI-establishing-shot gate in the animate route — an unresolvable
  // plan should fall back to the non-downgraded (unwatermarked) behavior.
  const user = project.email ? await getUser(project.email) : null;
  const isFreeTier = user ? user.plan === "free" : false;

  try {
    project.finalVideoUrl = await assembleFinalVideo(project, { isFreeTier });
    project.status = "done";
    project.error = undefined;
    if (project.email) await maybeGrantReferralReward(project.email);
  } catch (err) {
    project.status = "failed";
    project.error = err instanceof Error ? err.message : "Assembly failed";
  }

  await saveProject(project);
  return NextResponse.json({ project }, { status: project.status === "failed" ? 500 : 200 });
}
