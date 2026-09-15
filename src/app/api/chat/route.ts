import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { Audience, ChatSession } from "@/lib/types";
import { saveChatSession } from "@/lib/chatStore";
import { getOrCreateUser, canGenerate } from "@/lib/userStore";

const GREETINGS: Record<Audience, string> = {
  sale: "Hi! I'll help you put together a narrated property video. Do you have a listing URL (Rightmove, etc.), or would you rather upload photos directly?",
  airbnb: "Hi! I'll help you put together a narrated video for your Airbnb listing. Let's start with the basics — where's the place, and what's the nightly rate?",
};

/** Creates a new chat session with a hardcoded opening message — no need
 * to spend an API call on a greeting that's always the same. Requires an
 * email up front so the free-generation / monthly quota check has
 * someone to check against by the time the chat is ready to generate. */
export async function POST(request: NextRequest) {
  const { email, audience } = await request.json().catch(() => ({ email: undefined, audience: undefined }));
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  const resolvedAudience: Audience = audience === "airbnb" ? "airbnb" : "sale";

  const user = await getOrCreateUser(email);
  const quota = canGenerate(user);
  if (!quota.allowed) {
    return NextResponse.json({ error: quota.reason, upgradeRequired: true }, { status: 402 });
  }

  const now = new Date().toISOString();
  const session: ChatSession = {
    id: nanoid(),
    createdAt: now,
    updatedAt: now,
    messages: [{ role: "assistant", content: GREETINGS[resolvedAudience] }],
    draft: { photos: [] },
    email: user.email,
    audience: resolvedAudience,
  };
  await saveChatSession(session);
  return NextResponse.json({ session }, { status: 201 });
}
