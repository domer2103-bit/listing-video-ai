import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { getChatSession, saveChatSession } from "@/lib/chatStore";

/** Accepts multipart-uploaded photos for the upload flow, stores them
 * locally, and appends them (untagged) to the chat draft. The client then
 * tells the assistant what was uploaded so it can ask what room each is. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getChatSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "media", "uploads");
  await mkdir(dir, { recursive: true });

  const uploadedUrls: string[] = [];
  for (const file of files) {
    const ext = file.type.split("/")[1] ?? "jpg";
    const fileName = `${nanoid()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, fileName), buffer);
    const url = `/media/uploads/${fileName}`;
    uploadedUrls.push(url);
    session.draft.photos.push({ url });
  }

  await saveChatSession(session);
  return NextResponse.json({ uploadedUrls, session });
}
