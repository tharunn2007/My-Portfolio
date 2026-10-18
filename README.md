# Tharunn D — macOS Portfolio

An interactive, macOS-inspired developer portfolio built with **Next.js 16 + React 19**
(pure JavaScript). Desktop shows a full macOS desktop (Finder, Safari, Terminal, Maps,
VS Code-style preview, Siri assistant…); mobile renders an iOS-style experience with
the same apps.

Originally based on [macos-portfolio](https://github.com/kuldeeprajput-dev) by
**Kuldeep Rajput** (MIT) — heavily customized for Tharunn D.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional keys only — site works without them
npm run dev                  # http://localhost:3000
```

Login passcode = the current year (e.g. `2026`).

## Where everything personal lives

**One file: [`src/constants/profile.js`](src/constants/profile.js)** — name, handle
(terminal prompt), role, tagline, bio, location (Maps/Weather), email, phone, avatar
path, resume path, social links, projects, skills, site metadata, assistant answers.
Edit it and the whole site updates. Derived legacy constants live in
`src/constants/env.js` (you normally never touch it).

| What                  | Where                                                              |
| --------------------- | ------------------------------------------------------------------ |
| Identity / bio / role | `profile` in `src/constants/profile.js`                            |
| Social links          | `socialLinks` (same file)                                          |
| Projects              | `projectsList` (same file) — Finder folders + Safari cards + Terminal |
| Ongoing projects      | set `status: "in-progress"` and omit `link` → amber badge + "Demo coming soon" |
| Skills                | `skills` (Terminal `techstack` command + assistant)                |
| Terminal prompt       | `handle` field → `<handle>@macbook ~ %`                            |
| Map home + weather    | `location` fields                                                  |
| SEO / OG / manifest   | derived from `siteMeta` (`src/lib/seo.js`, `src/app/manifest.js`)  |

## Assets to replace

| Asset               | Path                                      | Notes                          |
| ------------------- | ----------------------------------------- | ------------------------------ |
| Avatar              | `public/contacts/avatars/avatar.webp`     | 256×256                        |
| Contact avatars     | `public/contacts/avatars/contact-{1,2}.webp` | 256×256                     |
| Resume              | `public/documents/resume.pdf`             | currently a placeholder PDF    |
| OG image            | `public/og-image/og-image.png`            | 1629×965                       |
| Favicon set         | `public/favicon/`                         | ico + pngs                     |
| Project screenshots | `public/projects/desktop/project-N.webp`, `public/projects/mobile/project-N-mob.webp` | 1280×800 / 441×789 |
| Gallery photos      | `public/gallery/**`                       | 800×600 webp                   |

## Environment variables

All optional — see `.env.example`. Real keys go in `.env.local` only (never committed):
`GROQ_API_KEY` (AI assistant), `NEXT_PUBLIC_JAMENDO_CLIENT_ID` (Music app),
`NEXT_PUBLIC_TMDB_API_KEY` (Apple TV), `NEXT_PUBLIC_VIDEOCALL_*` (call app names).

## Terminal commands

Open the Terminal app and try: `help`, `about`, `techstack`, `projects`, `socials`,
`whoami`, `neofetch`, `open <app>` (tab completion), `clear`.

## Notes

- **Husky**: hooks live in `.husky/` and activate via the `prepare` script on
  `npm install`. In a fresh `git init` clone they are installed automatically; if
  `pre-commit` complains before your first commit, run `npx husky` once.
- **Deploy**: `npm run build` locally to verify, then deploy to Vercel/Netlify and set
  `SITE_URL` + your keys in the dashboard env settings.
- Update the second LICENSE line to your name if you reuse this template.

## License

MIT — see [LICENSE](LICENSE) (original © Kuldeep Rajput, customizations © Tharunn D).
