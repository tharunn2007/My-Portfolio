import { projects } from "@constants";

// Safari bookmarks — project entries are derived from src/constants/profile.js.
// In-progress projects link to their GitHub repo.
export const DEFAULT_BOOKMARKS = [
  {
    id: 1,
    title: "Portfolio",
    url: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
    img: "/brands/portfolio.webp",
  },
  ...projects.map((project, index) => ({
    id: 2 + index,
    title: project.title,
    url: project.link || project.github || "https://github.com",
    img: "/brands/github.webp",
  })),
  {
    id: 2 + projects.length,
    title: "Wikipedia",
    url: "https://en.wikipedia.org",
    img: "https://en.wikipedia.org/favicon.ico",
  },
  {
    id: 3 + projects.length,
    title: "OpenStreetMap",
    url: "https://openstreetmap.org",
    img: "/brands/openstreetmap.webp",
  },
];
