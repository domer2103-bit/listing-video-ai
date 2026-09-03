import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { Project } from "@/lib/types";
import { saveProject, listProjects } from "@/lib/store";
import { scrapeListing } from "@/lib/scrapers";

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const sourceUrl: string | undefined = body?.sourceUrl;

  if (!sourceUrl) {
    return NextResponse.json({ error: "sourceUrl is required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const project: Project = {
    id: nanoid(),
    createdAt: now,
    updatedAt: now,
    sourceUrl,
    status: "scraping",
  };
  await saveProject(project);

  try {
    project.listing = await scrapeListing(sourceUrl);
    project.status = "scraped";
  } catch (err) {
    project.status = "failed";
    project.error = err instanceof Error ? err.message : "Scrape failed";
  }

  await saveProject(project);
  return NextResponse.json({ project }, { status: project.status === "failed" ? 500 : 201 });
}
