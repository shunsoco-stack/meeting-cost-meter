import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "会議コストメーター",
    short_name: "会議コスト",
    description: "会議の時間を、価値に。",
    start_url: "/",
    display: "standalone",
    lang: "ja",
    background_color: "#f5f7f6",
    theme_color: "#142b2d",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
