// ============================================================================
// PROFILE CONFIG — THE ONE FILE TO EDIT
// ----------------------------------------------------------------------------
// Every piece of personal content on this site (name, links, projects,
// skills, assistant answers, map location…) is read from this file.
// Edit the values below and the whole portfolio updates. No need to touch
// any component code.
//
// TIP: anything you leave as "Your …" will show up literally on the site,
// so replace it with your real details before deploying.
// ============================================================================

const NAME = "Tharunn D"; // Full name shown across the site (SEO, Siri, menus)
const FIRST_NAME = "Tharunn"; // Short name used in sentences like "who is <first name>"
const HANDLE = "tharunn"; // Username — used for the terminal prompt: <handle>@macbook

export const profile = {
  name: NAME,
  firstName: FIRST_NAME,
  handle: HANDLE,
  role: "Data Engineer",
  jobTitle: "Data Engineer", // Used in structured data (JSON-LD)
  tagline: "I break things more than building them XD",
  bio: [
    // Shown in Finder → About Me → about-me.txt (and reused by the assistant).
    "So hey! My name is Tharunn 👋 and I really want to become a Data Engineer — I grind for what I like to do.",
    "I'm telling you, you'll never get bored when you're with me!",
    "Fun fact... well, I have ADHD :)",
  ],
  location: {
    // Used by the Maps and Weather apps.
    city: "Coimbatore",
    region: "Tamil Nadu",
    country: "India",
    latitude: 11.0168,
    longitude: 76.9558,
  },
  email: "dtharunn2@gmail.com",
  phone: "+00 0000000000", // TODO: add phone number (optional)
  avatar: "/contacts/avatars/avatar.webp", // Drop your photo at public/contacts/avatars/avatar.webp
  resumeUrl: "/documents/resume.pdf", // Drop your resume at public/documents/resume.pdf
  portfolioZipUrl: "/portfolio-template.zip", // Downloadable source of this portfolio (public/portfolio-template.zip)
};

// Social links — used in the navbar, Safari bookmarks, Siri and the assistant.
export const socialLinks = {
  github: "https://github.com/tharunn2007",
  linkedin: "https://www.linkedin.com/in/tharunn-d-448279362/",
  twitter: "https://x.com/your-username", // TODO: add X/Twitter handle (or remove)
  portfolio: "https://example.com", // TODO: live site URL (update on deploy)
};

// Featured projects — shown in Finder, Safari, the assistant, and windows.
// Keep 2-4 entries. `aliases` are extra keywords the Siri assistant understands.
// Optional `status`: "in-progress" renders an amber "In Progress" badge and can
// omit `link` (great for ongoing work). Without status the project counts as live.
export const projectsList = [
  {
    id: 1,
    title: "veriTAS",
    status: "in-progress", // ongoing project + research paper — no live demo yet
    description:
      "A scalable news aggregation and analytics platform that collects, parses, stores, and analyzes high-volume news feeds, RSS channels, social media updates, and articles on a multi-tiered data lake / lakehouse architecture.",
    details: [
      "veriTAS is a scalable news aggregation and analytics platform. It collects, parses, stores, and analyzes high-volume news feeds, RSS channels, social media updates, and articles in one place.",
      "The system is designed around a multi-tiered data lake / lakehouse architecture, keeping raw ingestion and curated analytics layers separate so high-volume data stays manageable and queryable.",
      "Currently in active development, together with a research paper describing the approach. No live demo yet — follow the progress on GitHub.",
    ],
    image: "/projects/desktop/project-1.webp", // Desktop screenshot (public/projects/desktop/)
    mobileImage: "/projects/mobile/project-1-mob.webp", // Mobile screenshot (public/projects/mobile/)
    // link: no live demo yet — omit `link` entirely while the project is ongoing.
    github: "https://github.com/tharunn2007/veriTAS",
    aliases: ["veritas", "news platform", "news aggregator"],
  },
  {
    id: 2,
    title: "VoltRelay Hackathon",
    status: "in-progress", // ongoing hackathon project — no live demo yet
    description:
      "An open, evidence-based investigation into service quality, retention, and profitability on a simulated EV battery-swapping network in India — Data Analytics Hackathon by Gradient Learnings.",
    details: [
      "VoltRelay is my entry for a Data Analytics Hackathon hosted by Gradient Learnings.",
      "It is an open, evidence-based investigation into service quality, retention, and profitability on a simulated EV battery-swapping network in India.",
      "The analysis is ongoing — the work is being developed in the open on GitHub.",
    ],
    image: "/projects/desktop/project-2.webp",
    mobileImage: "/projects/mobile/project-2-mob.webp",
    // link: no live demo yet — omit `link` entirely while the project is ongoing.
    github: "https://github.com/tharunn2007/voltrelay-hackathon",
    aliases: ["voltrelay", "volt relay", "voltrelay-hackathon", "ev battery swapping", "hackathon"],
  },
];

// Skills — grouped exactly like the terminal "techstack" command expects.
// SAMPLE DATA — replace with your real skills.
export const skills = [
  { category: "Languages", items: ["JavaScript", "TypeScript", "Python"] },
  { category: "Frameworks", items: ["React.js", "Next.js", "Node.js"] },
  { category: "Tools", items: ["Git", "GitHub", "VS Code"] },
  { category: "Databases & Cloud", items: ["MongoDB", "PostgreSQL", "Vercel"] },
  { category: "Core CS", items: ["Data Structures", "Algorithms", "Operating Systems"] },
];

// Site metadata — page title, SEO description, Open Graph text.
export const siteMeta = {
  name: `${NAME} | macOS Portfolio`,
  shortName: "macOS Portfolio",
  description: `Explore ${NAME}'s macOS-inspired developer portfolio — featured projects, skills, and interactive desktop apps.`,
  ogImageAlt: `${NAME}'s macOS portfolio desktop preview`,
};

// Canned answers used by the Siri assistant and Terminal commands.
export const assistant = {
  aboutPortfolio: `This is ${NAME}'s interactive macOS-style portfolio, built with React and Next.js. Visitors can explore the projects, apps, and developer profile.`,
  whoAmI: `I can't identify visitors, but I can tell you about ${NAME} and the work shown here.`,
  aboutMe: `On this portfolio, About Me introduces ${NAME}. ${FIRST_NAME} is grinding toward a career in Data Engineering — and yes, you'll never get bored around ${FIRST_NAME}.`,
  aboutOwner: `${NAME} is an aspiring Data Engineer who grinds for what he loves (and occasionally breaks more things than he builds).`,
  whoAreYou: `I'm ${NAME}'s portfolio assistant. I can show visitors the projects, open apps, and answer questions about the work.`,
  systemPersona: `${NAME} is an aspiring Data Engineer who loves working with data.`,
};
