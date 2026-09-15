import React from "react";
import { z } from "zod";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing } from "remotion";

export const cameraMotionEnum = z.enum([
  "slow-push-in",
  "pan-left",
  "pan-right",
  "orbit-left",
  "orbit-right",
  "drone-rise",
  "zoom-in",
  "static",
]);

export const photoMotionSchema = z.object({
  image: z.string(),
  durationSec: z.number(),
  motion: cameraMotionEnum,
});

export type PhotoMotionProps = z.infer<typeof photoMotionSchema>;

const FPS = 30;
// Every image is pre-scaled by this much so pans/zooms always have room to
// move without ever exposing an edge.
const BASE_SCALE = 1.1;

/**
 * Ken-Burns-style motion over a single static photo, covering every
 * CameraMotion the scene planner can pick. Used for interior room shots
 * instead of kie.ai — no AI generation, exact duration match, free.
 *
 * Deliberately subtle/slow — a flat photo has no real depth, so anything
 * beyond a gentle drift reads as artificial. "orbit-left"/"orbit-right"
 * alias to a plain horizontal pan: an earlier version combined diagonal
 * drift with a scale ramp to approximate a real orbit, but that combination
 * read as an unwanted "spin" rather than a clean camera move.
 */
export const PhotoMotion: React.FC<PhotoMotionProps> = ({ image, durationSec, motion }) => {
  const frame = useCurrentFrame();
  const totalFrames = Math.round(durationSec * FPS);
  const t = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  let scale = BASE_SCALE;
  let translateXPct = 0;
  let translateYPct = 0;

  switch (motion) {
    case "slow-push-in":
      scale = 1 + t * (BASE_SCALE - 1) * 0.5;
      break;
    case "zoom-in":
      scale = 1 + t * (BASE_SCALE - 1) * 0.85;
      break;
    case "pan-left":
    case "orbit-left":
      translateXPct = interpolate(t, [0, 1], [1.5, -1.5]);
      break;
    case "pan-right":
    case "orbit-right":
      translateXPct = interpolate(t, [0, 1], [-1.5, 1.5]);
      break;
    case "drone-rise":
      translateYPct = interpolate(t, [0, 1], [1.5, -1.5]);
      break;
    case "static":
    default:
      scale = 1 + t * 0.015;
      break;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Img
        src={image}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translate(${translateXPct}%, ${translateYPct}%) scale(${scale})`,
        }}
      />
    </AbsoluteFill>
  );
};
