import {
  AVATAR_URL,
  EMAIL,
  GITHUB_PROFILE,
  OWNER_NAME,
  OWNER_HANDLE,
  OWNER_FIRST_NAME,
} from "@constants";

// Messages app sample conversations. The owner chat is config-driven; the two
// other chats are neutral sample contacts (assets: public/contacts/avatars/).
export const INITIAL_CONVERSATIONS = [
  {
    id: OWNER_HANDLE,
    name: OWNER_NAME,
    avatarColor: "bg-gradient-to-tr from-blue-500 to-indigo-500",
    initials: OWNER_FIRST_NAME.charAt(0).toUpperCase(),
    avatar: AVATAR_URL,
    unread: true,
    email: EMAIL,
    github: GITHUB_PROFILE,
    messages: [
      {
        id: 1,
        text: "Hey there! Welcome to my macOS portfolio.",
        sender: "them",
        time: "10:00 AM",
      },
      {
        id: 2,
        text: "Feel free to ask me anything here. I have automated some quick replies!",
        sender: "them",
        time: "10:01 AM",
      },
      {
        id: 3,
        text: "Try asking about: 'projects', 'skills', or 'contact'.",
        sender: "them",
        time: "10:01 AM",
      },
    ],
  },
  {
    id: "contact-1",
    name: "Contact One",
    avatarColor: "bg-gradient-to-tr from-indigo-500 to-purple-600",
    initials: "C",
    avatar: "/contacts/avatars/contact-1.webp",
    unread: false,
    email: "contact.one@example.com",
    github: "https://github.com",
    messages: [
      {
        id: 1,
        text: "Hey, did you check the new desktop mockup?",
        sender: "them",
        time: "Yesterday",
      },
      {
        id: 2,
        text: "Yeah, it looks super clean! The glassmorphism fits perfectly.",
        sender: "me",
        time: "Yesterday",
      },
      { id: 3, text: "Awesome! Let's get it deployed soon.", sender: "them", time: "Yesterday" },
    ],
  },
  {
    id: "contact-2",
    name: "Contact Two",
    avatarColor: "bg-gradient-to-tr from-purple-500 to-pink-600",
    initials: "C",
    avatar: "/contacts/avatars/contact-2.webp",
    unread: false,
    email: "contact.two@example.com",
    github: "https://github.com",
    messages: [
      {
        id: 1,
        text: "Hey! I'm online now. Let me know if you need help with coding.",
        sender: "them",
        time: "Yesterday",
      },
    ],
  },
];
