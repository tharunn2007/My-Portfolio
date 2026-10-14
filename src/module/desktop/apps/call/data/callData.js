import { OWNER_FIRST_NAME, AVATAR_URL } from "@constants";

// FaceTime display names — override via env (NEXT_PUBLIC_VIDEOCALL_OWNER,
// NEXT_PUBLIC_VIDEOCALL_CONTACT_1, NEXT_PUBLIC_VIDEOCALL_CONTACT_2).
export const VIDEOCALL_OWNER_NAME =
  process.env.NEXT_PUBLIC_VIDEOCALL_OWNER ?? OWNER_FIRST_NAME;
export const VIDEOCALL_CONTACT_1_NAME =
  process.env.NEXT_PUBLIC_VIDEOCALL_CONTACT_1 ?? "Contact One";
export const VIDEOCALL_CONTACT_2_NAME =
  process.env.NEXT_PUBLIC_VIDEOCALL_CONTACT_2 ?? "Contact Two";

export const CONTACTS = [
  {
    id: "contact-1",
    name: VIDEOCALL_CONTACT_1_NAME,
    status: "Frontend Developer",
    available: true,
    avatar: "/contacts/avatars/contact-1.webp",
    avatarColor: "bg-gradient-to-tr from-indigo-500 to-purple-600",
  },
  {
    id: "owner",
    name: VIDEOCALL_OWNER_NAME,
    status: "My Profile",
    available: true,
    avatar: AVATAR_URL,
    avatarColor: "bg-gradient-to-tr from-blue-500 to-indigo-600",
  },
  {
    id: "contact-2",
    name: VIDEOCALL_CONTACT_2_NAME,
    status: "Fullstack Engineer",
    available: true,
    avatar: "/contacts/avatars/contact-2.webp",
    avatarColor: "bg-gradient-to-tr from-purple-500 to-pink-600",
  },
];

export const DIALPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
