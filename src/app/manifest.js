import { OWNER_NAME, SITE_DESCRIPTION } from "../lib/seo";

const SITE_NAME = `${OWNER_NAME} - macOS Portfolio`;

export default function manifest() {
  return {
    name: SITE_NAME,
    short_name: "macOS Portfolio",
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#000000",
    theme_color: "#000000",
    categories: ["portfolio", "developer", "productivity"],
    icons: [
      {
        src: "/favicon/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
