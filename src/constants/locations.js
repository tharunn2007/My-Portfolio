import { profile, projectsList } from "./profile";
import {
  PROJECT_1_URL,
  PROJECT_1_GITHUB,
  PROJECT_2_URL,
  PROJECT_2_GITHUB,
  PROJECT_3_URL,
  PROJECT_3_GITHUB,
  PROJECT_4_URL,
  PROJECT_4_GITHUB,
} from "./env";

// ---------------------------------------------------------------------------
// Finder locations. Project folders are DERIVED from src/constants/profile.js
// (projectsList) — edit your projects there and the Finder updates.
// ---------------------------------------------------------------------------

const LEGACY_LINKS = [
  { url: PROJECT_1_URL, github: PROJECT_1_GITHUB },
  { url: PROJECT_2_URL, github: PROJECT_2_GITHUB },
  { url: PROJECT_3_URL, github: PROJECT_3_GITHUB },
  { url: PROJECT_4_URL, github: PROJECT_4_GITHUB },
];

const projectFolders = projectsList.map((project, index) => {
  const legacy = LEGACY_LINKS[index] ?? { url: "", github: "" };
  const link = project.link ?? legacy.url ?? "";
  const github = project.github ?? legacy.github ?? "";
  const children = [
    {
      id: 1,
      name: `${project.title} Project.txt`,
      icon: "/system/icons/files/txt.webp",
      kind: "file",
      fileType: "txt",
      position: "top-5 left-10",
      description:
        project.details ??
        (project.description ? [project.description] : ["Description coming soon."]),
    },
  ];
  let nextId = 2;
  if (link) {
    children.push({
      id: nextId++,
      name: "Live demo",
      icon: "/apps/safari.webp",
      kind: "file",
      fileType: "url",
      href: link,
      position: "top-10 right-20",
    });
  }
  children.push({
    id: nextId++,
    name: "screenshot.png",
    icon: "/system/icons/files/image.webp",
    kind: "file",
    fileType: "img",
    position: "top-52 right-80",
    imageUrl: project.image,
    imageMobUrl: project.mobileImage,
  });
  if (github) {
    children.push({
      id: nextId,
      name: "github.com",
      icon: "/brands/github.webp",
      kind: "file",
      fileType: "fig",
      href: github,
      position: "top-60 right-20",
    });
  }
  return {
    id: 5 + index,
    name: project.title,
    icon: "/system/icons/files/folder.webp",
    kind: "folder",
    position: ["top-10 left-5", "top-52 left-5", "top-10 left-80", "top-52 left-80"][
      index % 4
    ],
    windowPosition: `top-[${5 + index * 15}vh] left-6`,
    children,
  };
});

const WORK_LOCATION = {
  id: 1,
  type: "work",
  name: "Work",
  icon: "/system/icons/ui/work.svg",
  kind: "folder",
  children: projectFolders,
};

const ABOUT_LOCATION = {
  id: 2,
  type: "about",
  name: "About me",
  icon: "/system/icons/ui/info.svg",
  kind: "folder",
  children: [
    {
      id: 4,
      name: "about-me.txt",
      icon: "/system/icons/files/txt.webp",
      kind: "file",
      fileType: "txt",
      position: "top-60 left-5",
      subtitle: "Meet the Developer Behind the Code",
      description: profile.bio,
    },
  ],
};

const RESUME_LOCATION = {
  id: 3,
  type: "resume",
  name: "Resume",
  icon: "/system/icons/files/file.svg",
  kind: "folder",
  children: [
    {
      id: 1,
      name: "Resume.pdf",
      icon: "/system/icons/files/pdf.webp",
      kind: "file",
      fileType: "pdf",
    },
  ],
};

const TRASH_LOCATION = {
  id: 4,
  type: "trash",
  name: "Trash",
  icon: "/system/icons/dock/trash.svg",
  kind: "folder",
  children: [
    {
      id: 1,
      name: "trash1.png",
      icon: "/system/icons/files/image.webp",
      kind: "file",
      fileType: "img",
      position: "top-10 left-10",
      imageUrl: "/trash/trash-1.webp",
    },
    {
      id: 2,
      name: "trash2.png",
      icon: "/system/icons/files/image.webp",
      kind: "file",
      fileType: "img",
      position: "top-40 left-80",
      imageUrl: "/trash/trash-2.webp",
    },
  ],
};

export const locations = {
  work: WORK_LOCATION,
  about: ABOUT_LOCATION,
  resume: RESUME_LOCATION,
  trash: TRASH_LOCATION,
};
