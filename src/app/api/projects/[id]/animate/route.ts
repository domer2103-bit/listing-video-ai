import { NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/store";
import { animateScene } from "@/lib/pipeline/animateScene";
import { getUser } from "@/lib/userStore";
import { getPlan } from "@/lib/plans";
import { mapWithConcurrency } from "@/lib/pipeline/concurrency";

/** Interior shots and (on plans without the AI shot) the establishing shot
 * all render locally and synchronously via Remotion — each one spawns its
 * own headless Chromium + ffmpeg process, so they're capped to
 * ANIMATE_CONCURRENCY at a time rather than launched all at once. Only the
 * satellite establishing shot on plans with AI enabled kicks off async
 * kie.ai/Veo jobs — poll GET /api/projects/[id]/animate/status for those. */
const ANIMATE_CONCURRENCY = Number(process.env.ANIMATE_CONCURRENCY ?? 2);
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (!project.scenes?.length || !project.listing) {
    return NextResponse.json({ error: "Project has no scenes yet — run /script first" }, { status: 400 });
  }

  // Projects with no email attached predate this gate or were created out
  // of band (internal tooling) — default to allowed rather than silently
  // downgrading output for a case the real user-facing flows never hit,
  // since both now always attach an email.
  const user = project.email ? await getUser(project.email) : null;
  const allowAiEstablishingShot = user ? getPlan(user.plan).aiEstablishingShot : true;

  project.status = "animating";
  await saveProject(project);

  try {
    await mapWithConcurrency(project.scenes, ANIMATE_CONCURRENCY, (scene) =>
      animateScene(scene, project.listing!, { allowAiEstablishingShot })
    );
    project.error = undefined;
  } catch (err) {
    project.status = "failed";
    project.error = err instanceof Error ? err.message : "Animation job submission failed";
  }

  await saveProject(project);
  return NextResponse.json({ project }, { status: project.status === "failed" ? 500 : 202 });
}
