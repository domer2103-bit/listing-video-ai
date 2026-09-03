import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { Project } from "./types";

/**
 * File-based project store for local development.
 * Swap for a real database (Postgres/SQLite/etc.) before this goes to
 * production or handles concurrent users — this has no locking and
 * won't survive a serverless deploy with ephemeral disk.
 */

const DATA_DIR = path.join(process.cwd(), "data", "projects");

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

function projectPath(id: string) {
  return path.join(DATA_DIR, `${id}.json`);
}

export async function saveProject(project: Project): Promise<void> {
  await ensureDataDir();
  project.updatedAt = new Date().toISOString();
  await writeFile(projectPath(project.id), JSON.stringify(project, null, 2), "utf-8");
}

export async function getProject(id: string): Promise<Project | null> {
  try {
    const raw = await readFile(projectPath(id), "utf-8");
    return JSON.parse(raw) as Project;
  } catch {
    return null;
  }
}

export async function listProjects(): Promise<Project[]> {
  await ensureDataDir();
  const { readdir } = await import("fs/promises");
  const files = await readdir(DATA_DIR);
  const projects = await Promise.all(
    files
      .filter((f) => f.endsWith(".json"))
      .map((f) => readFile(path.join(DATA_DIR, f), "utf-8").then((raw) => JSON.parse(raw) as Project))
  );
  return projects.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
