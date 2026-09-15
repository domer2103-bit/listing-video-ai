"use client";

import { useEffect, useRef, useState } from "react";
import { Audience, ChatMessage, ChatSession, Project } from "@/lib/types";
import { runPipeline } from "@/lib/clientPipeline";
import { CURATED_VOICES, voiceSampleUrl } from "@/lib/voices";
import { useStoredEmail } from "@/lib/useStoredEmail";
import { EmailGate } from "@/components/EmailGate";
import { ChatBubbleContent } from "@/components/ChatBubbleContent";

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

export default function CreateChat() {
  const { email, setEmail, loaded } = useStoredEmail();
  // Starts as "sale" on both server and client to avoid a hydration
  // mismatch, then flips right after mount if ?mode=airbnb is present.
  const [audience, setAudience] = useState<Audience>("sale");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "airbnb") setAudience("airbnb");
  }, []);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!email || sessionId) return;
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, audience }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 402) {
          setUpgradeMessage(data.error ?? "You've reached your plan's video limit.");
          return;
        }
        if (!res.ok) throw new Error(data.error ?? "Failed to start chat");
        const session = data.session as ChatSession;
        setSessionId(session.id);
        setMessages(session.messages);
      })
      .catch((err) => setUpgradeMessage(err instanceof Error ? err.message : String(err)));
  }, [email, sessionId, audience]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, log]);

  function appendLog(line: string) {
    setLog((prev) => [...prev, line]);
  }

  async function sendMessage(text: string) {
    if (!sessionId || !text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chat request failed");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (data.upgradeRequired) setUpgradeMessage(data.reply);

      if (data.readyToGenerate && data.projectId) {
        await startGeneration(data.projectId);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Something went wrong: ${err instanceof Error ? err.message : String(err)}` },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function startGeneration(projectId: string) {
    setGenerating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      setProject(data.project as Project);
      await runPipeline(projectId, appendLog, setProject);
    } catch (err) {
      appendLog(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!sessionId || !files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("files", f));

      const res = await fetch(`/api/chat/${sessionId}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      const uploadedUrls = data.uploadedUrls as string[];
      await sendMessage(
        `I've uploaded ${uploadedUrls.length} photo${uploadedUrls.length === 1 ? "" : "s"}: ${uploadedUrls.join(", ")}`
      );
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Upload failed: ${err instanceof Error ? err.message : String(err)}` },
      ]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!loaded) {
    return <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16" />;
  }

  if (!email) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Create a video</h1>
          <p className="text-neutral-500">
            {audience === "airbnb"
              ? "Chat with the assistant to get started — upload your photos and answer a few quick questions."
              : "Chat with the assistant to get started — paste a listing link, or upload photos and answer a few quick questions."}
          </p>
        </header>
        <EmailGate onSubmit={setEmail} />
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Create a video</h1>
        <p className="text-neutral-500">
          {audience === "airbnb"
            ? "Chat with the assistant to get started — upload your photos and answer a few quick questions."
            : "Chat with the assistant to get started — paste a listing link, or upload photos and answer a few quick questions."}
        </p>
      </header>

      {upgradeMessage && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <ChatBubbleContent
            content={upgradeMessage}
            className="font-medium underline underline-offset-2"
          />
        </div>
      )}

      <div className="space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                m.role === "user"
                  ? "rounded-br-sm bg-[#1D1B3A] text-white"
                  : "rounded-bl-sm border border-[#00DEB0]/30 bg-[#00DEB0]/10 text-neutral-800"
              }`}
            >
              <ChatBubbleContent
                content={m.content}
                className={
                  m.role === "user"
                    ? "text-[#00DEB0] underline underline-offset-2 font-medium"
                    : "text-[#0F9B7A] underline underline-offset-2 font-medium"
                }
              />
            </div>
          </div>
        ))}
        {sending && <div className="text-sm text-neutral-400">Thinking…</div>}
        <div ref={bottomRef} />
      </div>

      {!generating && (
        <details className="rounded-md border border-neutral-200 p-4">
          <summary className="cursor-pointer text-sm font-medium text-neutral-700">
            🔊 Preview narration voices
          </summary>
          <ul className="mt-4 space-y-3">
            {CURATED_VOICES.map((voice) => (
              <li key={voice.id} className="flex flex-wrap items-center gap-3 text-sm">
                <span className="w-full sm:w-56 shrink-0 text-neutral-700">{voice.label}</span>
                <audio controls src={voiceSampleUrl(voice.id)} className="h-8 flex-1 min-w-[180px]" />
                <button
                  type="button"
                  disabled={sending || !sessionId}
                  onClick={() => sendMessage(`I'd like the ${voice.id} voice`)}
                  className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium disabled:opacity-40"
                >
                  Choose
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {!generating && (
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
        >
          <input
            type="text"
            placeholder="Type your reply…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending || !sessionId}
            className="flex-1 min-w-0 rounded-md border border-neutral-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <div className="flex gap-3">
            <button
              type="button"
              disabled={uploading || sending || !sessionId}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-none rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              {uploading ? "Uploading…" : "Upload photos"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => handleUpload(e.target.files)}
            />
            <button
              type="submit"
              disabled={sending || !input.trim() || !sessionId}
              className="flex-1 sm:flex-none rounded-md bg-neutral-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </form>
      )}

      {generating && (
        <section className="space-y-6 border-t border-neutral-200 pt-8">
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
          )}

          {project?.error && <p className="text-sm text-red-600">{project.error}</p>}

          {project?.finalVideoUrl && (
            <video controls className="w-full rounded-lg border border-neutral-200">
              <source src={project.finalVideoUrl} type="video/mp4" />
            </video>
          )}
        </section>
      )}
    </main>
  );
}
