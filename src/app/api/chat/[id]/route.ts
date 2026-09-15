import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getChatSession, saveChatSession } from "@/lib/chatStore";
import { saveProject } from "@/lib/store";
import { runChatTurn } from "@/lib/chat/agent";
import { buildListingFromDraft } from "@/lib/chat/buildListing";
import { Project } from "@/lib/types";
import { canGenerate, getOrCreateUser, recordGenerationUsed } from "@/lib/userStore";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getChatSession(id);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  return NextResponse.json({ session });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getChatSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { message } = await request.json();
  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  let { reply, readyToGenerate } = await runChatTurn(session, message);

  let projectId: string | undefined;
  let upgradeRequired = false;
  if (readyToGenerate && !session.projectId) {
    const user = session.email ? await getOrCreateUser(session.email) : null;
    const quota = user ? canGenerate(user) : { allowed: false, reason: "No email on this session." };

    if (!quota.allowed) {
      readyToGenerate = false;
      upgradeRequired = true;
      reply = quota.reason ?? "You've reached your plan's video limit.";
    } else {
      const listing = buildListingFromDraft(session.draft);
      const now = new Date().toISOString();
      const project: Project = {
        id: nanoid(),
        createdAt: now,
        updatedAt: now,
        sourceUrl: listing.sourceUrl,
        status: "scraped",
        listing,
        voiceId: session.draft.voiceId,
        email: session.email,
        audience: session.audience ?? "sale",
      };
      await saveProject(project);
      session.projectId = project.id;
      projectId = project.id;
      if (session.email) await recordGenerationUsed(session.email);
    }
  }

  await saveChatSession(session);
  return NextResponse.json({ session, reply, readyToGenerate, projectId, upgradeRequired });
}
