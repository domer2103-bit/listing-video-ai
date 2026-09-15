import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { ChatSession } from "./types";

/** File-based chat session store, same pattern as store.ts. */

const DATA_DIR = path.join(process.cwd(), "data", "chats");

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

function sessionPath(id: string) {
  return path.join(DATA_DIR, `${id}.json`);
}

export async function saveChatSession(session: ChatSession): Promise<void> {
  await ensureDataDir();
  session.updatedAt = new Date().toISOString();
  await writeFile(sessionPath(session.id), JSON.stringify(session, null, 2), "utf-8");
}

export async function getChatSession(id: string): Promise<ChatSession | null> {
  try {
    const raw = await readFile(sessionPath(id), "utf-8");
    return JSON.parse(raw) as ChatSession;
  } catch {
    return null;
  }
}
