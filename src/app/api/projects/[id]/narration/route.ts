import { NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/store";
import { synthesizeSpeech } from "@/lib/clients/inworld";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (!project.scenes?.length) {
    return NextResponse.json({ error: "Project has no scenes yet — run /script first" }, { status: 400 });
  }

  project.status = "narrating";
  await saveProject(project);

  try {
    for (const scene of project.scenes) {
      const { audioUrl, durationSec } = await synthesizeSpeech({ text: scene.narration, voiceId: project.voiceId });
      scene.narrationAudioUrl = audioUrl;
      scene.narrationDurationSec = durationSec;
    }
    project.status = "narrated";
    project.error = undefined;
  } catch (err) {
    project.status = "failed";
    project.error = err instanceof Error ? err.message : "Narration generation failed";
  }

  await saveProject(project);
  return NextResponse.json({ project }, { status: project.status === "failed" ? 500 : 200 });
}
