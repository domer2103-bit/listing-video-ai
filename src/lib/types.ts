/** Who this video is being made for — drives narration framing (sale
 * pitch vs. booking pitch) and which intake flow is offered (Airbnb can't
 * be scraped, so "airbnb" always uses the upload flow). */
export type Audience = "sale" | "airbnb";

export type CameraMotion =
  | "slow-push-in"
  | "pan-left"
  | "pan-right"
  | "orbit-left"
  | "orbit-right"
  | "drone-rise"
  | "zoom-in"
  | "static";

export type PipelineStatus =
  | "created"
  | "scraping"
  | "scraped"
  | "scripting"
  | "scripted"
  | "narrating"
  | "narrated"
  | "animating"
  | "animated"
  | "assembling"
  | "done"
  | "failed";

export interface ListingData {
  sourceUrl: string;
  address: string;
  price: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  description: string;
  photos: string[];
  floorplanUrl?: string;
  location?: {
    lat: number;
    lng: number;
  };
  agent?: {
    name?: string;
    phone?: string;
    agency?: string;
  };
}

export interface Scene {
  id: string;
  order: number;
  sourceImageUrl: string;
  /** "establishing" = satellite/street-view intro shot, not a listing photo. */
  kind: "interior" | "establishing";
  /** Only set when kind === "establishing" — which establishing shot this is. */
  establishingView?: "satellite" | "streetview";
  roomType?: string;
  narration: string;
  onScreenText?: string;
  cameraMotion: CameraMotion;

  narrationAudioUrl?: string;
  narrationDurationSec?: number;

  /** For the satellite establishing shot, this is the orbit (Kling) job;
   * the zoom-in descent runs as a separate parallel job, see below. */
  videoJobId?: string;
  videoStatus: "pending" | "processing" | "ready" | "failed";
  videoClipUrl?: string;
  videoError?: string;

  /** Satellite establishing shot only: a Veo3 job that generates the
   * whole-earth -> close-up zoom-in descent (first/last-frame
   * interpolation), running in parallel with the kie.ai orbit job above.
   * Once both jobs are ready, the two clips get concatenated (descent then
   * orbit) into the final videoClipUrl and these fields are cleared. */
  zoomJobId?: string;
  zoomClipUrl?: string;
  orbitClipUrl?: string;

  /** Satellite establishing shot only: the zoom clip's actual rendered
   * duration, in seconds. Narration is delayed by this much at assemble
   * time so it starts when the orbit footage begins, not over the silent
   * zoom-in. */
  introSilenceSec?: number;
}

export interface Project {
  id: string;
  createdAt: string;
  updatedAt: string;
  sourceUrl: string;
  status: PipelineStatus;
  error?: string;
  listing?: ListingData;
  scenes?: Scene[];
  finalVideoUrl?: string;
  /** Inworld voiceId for narration — falls back to INWORLD_VOICE_ID (or
   * Inworld's own default) when unset. */
  voiceId?: string;
  /** Whose free generation / monthly quota this video counts against —
   * set at creation time, used by the animate route to decide whether the
   * AI satellite establishing shot is allowed for this plan. */
  email?: string;
  /** Defaults to "sale" for projects created before this field existed. */
  audience?: Audience;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TaggedPhoto {
  url: string;
  roomType?: string;
}

/** What the chat assistant has gathered so far, before a Project exists. */
export interface ChatDraft {
  flow?: "url" | "upload";
  sourceUrl?: string;
  address?: string;
  price?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  description?: string;
  photos: TaggedPhoto[];
  /** Set once set_listing_url successfully scrapes a listing. */
  scrapedListing?: ListingData;
  /** Inworld voiceId chosen for narration — optional, falls back to the
   * pipeline default if the user doesn't pick one. */
  voiceId?: string;
}

export interface ChatSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  draft: ChatDraft;
  /** Set once ready_to_generate fires and a Project has been created. */
  projectId?: string;
  /** Captured before the chat starts — whose free generation / quota this
   * session's video counts against. */
  email?: string;
  /** Set from the landing page the chat was launched from. Defaults to
   * "sale" when absent (older sessions, direct API calls). */
  audience?: Audience;
}
