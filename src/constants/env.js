// ============================================================================
// DERIVED CONSTANTS — you normally never edit this file.
// Every value below is computed from src/constants/profile.js so the legacy
// names other components import (OWNER_NAME, PROJECT_1_URL, …) keep working.
// ============================================================================

import { profile, socialLinks, projectsList } from "./profile";

export const OWNER_NAME = profile.name;
export const OWNER_FIRST_NAME = profile.firstName;
export const OWNER_HANDLE = profile.handle;
export const AVATAR_URL = profile.avatar;
export const RESUME_URL = profile.resumeUrl;
export const OWNER_LOCATION = profile.location;

export const GITHUB_PROFILE = socialLinks.github;
export const TWITTER_URL = socialLinks.twitter;
export const LINKEDIN_URL = socialLinks.linkedin;
export const GITHUB_USERNAME = GITHUB_PROFILE.replace(/\/+$/, "").split("/").pop();

export const PORTFOLIO_URL = socialLinks.portfolio;
export const PORTFOLIO_ALT_URL = socialLinks.portfolio;
export const EMAIL = profile.email;
export const PHONE = profile.phone;

// Display name for the "portfolio" app in the navbar menus.
export const PORTFOLIO_APP_NAME = `${profile.name}'s Portfolio`;

// Legacy per-project constants, derived from the projects list.
// Missing entries resolve to "" so consumers can hide the related UI.
export const PROJECT_1_URL = projectsList[0]?.link ?? "";
export const PROJECT_1_GITHUB = projectsList[0]?.github ?? "";
export const PROJECT_2_URL = projectsList[1]?.link ?? "";
export const PROJECT_2_GITHUB = projectsList[1]?.github ?? "";
export const PROJECT_3_URL = projectsList[2]?.link ?? "";
export const PROJECT_3_GITHUB = projectsList[2]?.github ?? "";
export const PROJECT_4_URL = projectsList[3]?.link ?? "";
export const PROJECT_4_GITHUB = projectsList[3]?.github ?? "";
