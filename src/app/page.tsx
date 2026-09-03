"use client";

import { useState } from "react";
import { Project } from "@/lib/types";

const STAGE_LABELS: Record<string, string> = {
  created: "Created",
  scraping: "Scraping listing…",
  scraped: "Listing scraped",
  scripting: "Writing script…",
  scripted: "Script ready",
  narrating: "Generating narration…",
  narrated: "Narration ready",
  animating: "Animating scenes…",
  animated: "Scenes animated",
  assembling: "Assembling final video…",
  done: "Done",
  failed: "Failed",
};

async function postJSON(url: string) {
  const res = await fetch(url, { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request to ${url} failed`);
  return data.project as Project;
}

export default function Home() {
  const [sourceUrl, setSourceUrl] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  function appendLog(line: string) {
    setLog((prev) => [...prev, line]);
  }

  async function pollAnimation(id: string): Promise<Project> {
    while (true) {
      const res = await fetch(`/api/projects/${id}/animate/status`);
      const data = await res.json();
      const p = data.project as Project;
      setProject(p);
      if (p.status === "animated" || p.status === "failed") return p;
      await new Promise((r) => setTimeout(r, 4000));
    }
  }

  async function runPipeline() {
    if (!sourceUrl) return;
    setRunning(true);
    setLog([]);
    setProject(null);

    try {
      appendLog("Creating project & scraping listing…");
      const created = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to create project");
        return data.project as Project;
      });
      setProject(created);
      if (created.status === "failed") throw new Error(created.error ?? "Scrape failed");

      appendLog("Writing scene plan & narration script…");
      let p = await postJSON(`/api/projects/${created.id}/script`);
      setProject(p);
      if (p.status === "failed") throw new Error(p.error ?? "Script generation failed");

      appendLog("Synthesizing narration with Inworld AI…");
      p = await postJSON(`/api/projects/${created.id}/narration`);
      setProject(p);
      if (p.status === "failed") throw new Error(p.error ?? "Narration failed");

      appendLog("Submitting scenes to kie.ai for animation…");
      p = await postJSON(`/api/projects/${created.id}/animate`);
      setProject(p);
      if (p.status === "failed") throw new Error(p.error ?? "Animation submission failed");

      appendLog("Waiting for animated clips…");
      p = await pollAnimation(created.id);
      if (p.status === "failed") throw new Error(p.error ?? "Animation failed");

      appendLog("Assembling final video…");
      p = await postJSON(`/api/projects/${created.id}/assemble`);
      setProject(p);
      if (p.status === "failed") throw new Error(p.error ?? "Assembly failed");

      appendLog("Done!");
    } catch (err) {
      appendLog(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Listing Video AI</h1>
        <p className="text-neutral-500">
          Paste a property listing URL, get a narrated promo video back — no
          avatar, just scraped photos animated with kie.ai and voiced with
          Inworld AI.
        </p>
      </header>

      <form
        className="flex gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          runPipeline();
        }}
      >
        <input
          type="url"
          required
          placeholder="https://www.rightmove.co.uk/properties/..."
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          className="flex-1 rounded-md border border-neutral-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
        <button
          type="submit"
          disabled={running}
          className="rounded-md bg-neutral-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {running ? "Generating…" : "Generate video"}
        </button>
      </form>

      {log.length > 0 && (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm space-y-1 font-mono">
          {log.map((line, i) => (
            <div key={i} className="text-neutral-600">
              {line}
            </div>
          ))}
        </div>
      )}

      {project && (
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Status:</span>
            <span
              className={
                project.status === "failed"
                  ? "text-red-600"
                  : project.status === "done"
                    ? "text-green-600"
                    : "text-neutral-600"
              }
            >
              {STAGE_LABELS[project.status] ?? project.status}
            </span>
          </div>

          {project.error && (
            <p className="text-sm text-red-600">{project.error}</p>
          )}

          {project.listing && (
            <div className="text-sm space-y-1">
              <p className="font-medium">{project.listing.address || "Listing"}</p>
              <p className="text-neutral-500">
                {project.listing.price} · {project.listing.photos.length} photos found
              </p>
            </div>
          )}

          {project.finalVideoUrl && (
            <video controls className="w-full rounded-lg border border-neutral-200">
              <source src={project.finalVideoUrl} type="video/mp4" />
            </video>
          )}

          {project.scenes && project.scenes.length > 0 && (
            <ol className="space-y-3">
              {project.scenes.map((scene) => (
                <li
                  key={scene.id}
                  className="flex items-start gap-3 rounded-md border border-neutral-200 p-3 text-sm"
                >
                  <img
                    src={scene.sourceImageUrl}
                    alt={scene.roomType ?? "scene"}
                    className="h-16 w-24 rounded object-cover"
                  />
                  <div className="flex-1 space-y-1">
                    <p className="font-medium capitalize">{scene.roomType}</p>
                    <p className="text-neutral-600">{scene.narration}</p>
                    <p className="text-xs text-neutral-400">
                      {scene.cameraMotion} · video: {scene.videoStatus}
                      {scene.narrationAudioUrl ? " · narration ready" : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </main>
  );
}
