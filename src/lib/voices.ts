/** A curated shortlist of Inworld's ~160 English voices, picked for
 * real-estate narration — Inworld has no per-voice "use case" filter, so
 * this list is hand-picked rather than pulled live. Plain data (no
 * server-only imports) so it's safe to use from client components too. */
export const CURATED_VOICES = [
  { id: "Dennis", label: "Dennis — warm, calm, friendly (default)" },
  { id: "Rosalind", label: "Rosalind — mature, warm British female, documentary style" },
  { id: "Graham", label: "Graham — authoritative British male, luxury-brand tone" },
  { id: "Cordelia", label: "Cordelia — refined, composed British female" },
  { id: "Tristan", label: "Tristan — polished, deliberate male, documentary voiceover" },
  { id: "Elizabeth", label: "Elizabeth — professional American female" },
] as const;

export const VOICE_SAMPLE_TEXT =
  "Welcome to this beautifully presented home, featuring spacious interiors and a private garden — perfect for modern family living.";

export function voiceSampleUrl(voiceId: string): string {
  return `/media/voice-samples/${voiceId}.mp3`;
}
