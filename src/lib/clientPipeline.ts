import { Project } from "./types";

async function postJSON(url: string): Promise<Project> {
  const res = await fetch(url, { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request to ${url} failed`);
  return data.project as Project;
}

async function pollAnimation(id: string, onUpdate: (p: Project) => void): Promise<Project> {
  while (true) {
    const res = await fetch(`/api/projects/${id}/animate/status`);
    const data = await res.json();
    const p = data.project as Project;
    onUpdate(p);
    if (p.status === "animated" || p.status === "failed") return p;
    await new Promise((r) => setTimeout(r, 4000));
  }
}

/** Runs script -> narration -> animate -> poll -> assemble for an
 * already-created (scraped) project, reporting progress via callbacks. */
export async function runPipeline(
  projectId: string,
  onLog: (line: string) => void,
  onUpdate: (p: Project) => void
): Promise<Project> {
  onLog("Writing scene plan & narration script…");
  let p = await postJSON(`/api/projects/${projectId}/script`);
  onUpdate(p);
  if (p.status === "failed") throw new Error(p.error ?? "Script generation failed");

  onLog("Synthesizing narration with Inworld AI…");
  p = await postJSON(`/api/projects/${projectId}/narration`);
  onUpdate(p);
  if (p.status === "failed") throw new Error(p.error ?? "Narration failed");

  onLog("Animating scenes…");
  p = await postJSON(`/api/projects/${projectId}/animate`);
  onUpdate(p);
  if (p.status === "failed") throw new Error(p.error ?? "Animation submission failed");

  onLog("Waiting for animated clips…");
  p = await pollAnimation(projectId, onUpdate);
  if (p.status === "failed") throw new Error(p.error ?? "Animation failed");

  onLog("Assembling final video…");
  p = await postJSON(`/api/projects/${projectId}/assemble`);
  onUpdate(p);
  if (p.status === "failed") throw new Error(p.error ?? "Assembly failed");

  onLog("Done!");
  return p;
}
