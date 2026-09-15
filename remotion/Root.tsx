import React from "react";
import { Composition } from "remotion";
import { KenBurnsZoom, kenBurnsZoomSchema, KenBurnsZoomProps } from "./KenBurnsZoom";
import { PhotoMotion, photoMotionSchema, PhotoMotionProps } from "./PhotoMotion";

const defaultKenBurnsProps: KenBurnsZoomProps = { image: "", durationSec: 6 };
const defaultPhotoMotionProps: PhotoMotionProps = { image: "", durationSec: 6, motion: "slow-push-in" };

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="KenBurnsZoom"
        component={KenBurnsZoom}
        schema={kenBurnsZoomSchema}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultKenBurnsProps}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: Math.round(props.durationSec * 30),
        })}
      />
      <Composition
        id="PhotoMotion"
        component={PhotoMotion}
        schema={photoMotionSchema}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultPhotoMotionProps}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: Math.round(props.durationSec * 30),
        })}
      />
    </>
  );
};
