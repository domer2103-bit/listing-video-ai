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
  roomType?: string;
  narration: string;
  onScreenText?: string;
  cameraMotion: CameraMotion;

  narrationAudioUrl?: string;
  narrationDurationSec?: number;

  videoJobId?: string;
  videoStatus: "pending" | "processing" | "ready" | "failed";
  videoClipUrl?: string;
  videoError?: string;
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
}
