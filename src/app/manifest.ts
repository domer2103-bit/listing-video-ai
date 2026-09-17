import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Online Viewing",
    short_name: "Online Viewing",
    description:
      "Turn any property listing into a cinematic, AI-narrated promo video — no camera crew, no editor.",
    start_url: "/",
    display: "standalone",
    background_color: "#10131f",
    theme_color: "#10131f",
    icons: [
      { src: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
