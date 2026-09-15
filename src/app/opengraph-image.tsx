import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#1D1B3A",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#00DEB0",
            marginBottom: 24,
          }}
        >
          AI-narrated property video
        </div>
        <div
          style={{
            fontSize: 68,
            fontWeight: 700,
            lineHeight: 1.15,
            color: "white",
            maxWidth: 950,
          }}
        >
          Turn any listing into a cinematic promo video
        </div>
        <div style={{ fontSize: 32, color: "#00DEB0", marginTop: 16, fontWeight: 600 }}>
          — no camera crew, no editor.
        </div>
      </div>
    ),
    { ...size }
  );
}
