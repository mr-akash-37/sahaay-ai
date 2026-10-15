import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sahaay AI — welfare scheme guide",
    short_name: "Sahaay AI",
    description: "Find the government schemes you qualify for, in English, ಕನ್ನಡ or हिन्दी.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FAFAF7",
    theme_color: "#0F4C81",
    lang: "en",
    categories: ["government", "utilities", "education"],
    icons: [
      { src: "/app-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
