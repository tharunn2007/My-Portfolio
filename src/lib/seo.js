import { TWITTER_URL } from "../constants/env";
import { profile, siteMeta } from "../constants/profile";
import { absoluteSiteUrl } from "./site-url";

export const OWNER_NAME = profile.name;
export const SITE_NAME = siteMeta.name;
export const SITE_DESCRIPTION = siteMeta.description;

const previewImage = absoluteSiteUrl("/og-image/og-image.png");
const twitterHandle = (() => {
  try {
    const handle = new URL(TWITTER_URL).pathname.split("/").filter(Boolean)[0];
    if (!handle || /your-username/i.test(handle)) return null; // placeholder guard
    return handle;
  } catch {
    return null;
  }
})();

export function pageMetadata({ path = "/", title = SITE_NAME, description = SITE_DESCRIPTION }) {
  const socialTitle = title === SITE_NAME ? title : `${title} | ${OWNER_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: absoluteSiteUrl(path) },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: absoluteSiteUrl(path),
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      images: [
        {
          url: previewImage,
          width: 1629,
          height: 965,
          alt: siteMeta.ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [previewImage],
      creator: twitterHandle ? `@${twitterHandle}` : undefined,
    },
  };
}
