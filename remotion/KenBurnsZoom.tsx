import React from "react";
import { z } from "zod";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing } from "remotion";

export const kenBurnsZoomSchema = z.object({
  image: z.string(),
  durationSec: z.number(),
});

export type KenBurnsZoomProps = z.infer<typeof kenBurnsZoomSchema>;

const FPS = 30;

/** Simple single-image push-in — used for the street-view establishing shot
 * instead of an AI-generated clip, since it's just camera motion over a
 * static photo with nothing to hallucinate. */
export const KenBurnsZoom: React.FC<KenBurnsZoomProps> = ({ image, durationSec }) => {
  const frame = useCurrentFrame();
  const totalFrames = Math.round(durationSec * FPS);
  const scale = interpolate(frame, [0, totalFrames], [1, 1.1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Img
        src={image}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }}
      />
    </AbsoluteFill>
  );
};
