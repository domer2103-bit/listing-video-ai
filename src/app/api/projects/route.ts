import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { Project } from "@/lib/types";
import { saveProject, listProjects } from "@/lib/store";
import { scrapeListing } from "@/lib/scrapers";
import { canGenerate, getOrCreateUser, recordGenerationUsed } from "@/lib/userStore";

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const sourceUrl: string | undefined = body?.sourceUrl;
  const email: string | undefined = body?.email;

  if (!sourceUrl) {
    return NextResponse.json({ error: "sourceUrl is required" }, { status: 400 });
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const user = await getOrCreateUser(email);
  const quota = canGenerate(user);
  if (!quota.allowed) {
    return NextResponse.json({ error: quota.reason, upgradeRequired: true }, { status: 402 });
  }

  const now = new Date().toISOString();
  const project: Project = {
    id: nanoid(),
    createdAt: now,
    updatedAt: now,
    sourceUrl,
    status: "scraping",
    email: user.email,
    audience: "sale",
  };
  await saveProject(project);

  try {
    project.listing = await scrapeListing(sourceUrl);
    project.status = "scraped";
    await recordGenerationUsed(user.email);
  } catch (err) {
    project.status = "failed";
    project.error = err instanceof Error ? err.message : "Scrape failed";
  }

  await saveProject(project);
  return NextResponse.json({ project }, { status: project.status === "failed" ? 500 : 201 });
}
