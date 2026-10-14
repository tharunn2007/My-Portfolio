import { projectsList } from "./profile";

// Projects come from src/constants/profile.js (projectsList).
export const projects = projectsList.map((project) => ({
  id: project.id,
  title: project.title,
  status: project.status ?? "live", // "in-progress" | "live"
  description: project.description,
  details: project.details ?? [],
  image: project.image,
  mobileImage: project.mobileImage,
  link: project.link ?? "",
  github: project.github ?? "",
  aliases: project.aliases ?? [],
}));
