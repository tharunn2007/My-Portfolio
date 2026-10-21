import { Copy, Check } from "lucide-react";
import { AVATAR_URL, OWNER_FIRST_NAME } from "@constants";

const ContactCard = ({ _label, email, phone, copied, onCopy }) => (
  <>
    <img src={AVATAR_URL} alt={OWNER_FIRST_NAME.toLowerCase()} className="w-20 rounded-full" />
    <h3>Let's Connect</h3>
    <p>Full-stack developer building scalable apps—let's connect and create something impactful.</p>
    <button
      type="button"
      className="flex w-full min-w-0 items-center gap-3 py-2 text-left cursor-pointer group select-text"
      aria-label="Copy email address"
      onClick={() => onCopy(email, "email")}
    >
      <span className="min-w-0 break-all hover:text-blue-500 transition-colors">{email}</span>
      {copied === "email" ? (
        <Check size={14} className="text-green-500 animate-in zoom-in" />
      ) : (
        <Copy
          size={14}
          className="text-gray-400 opacity-60 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
        />
      )}
      {copied === "email" && (
        <span className="text-xs text-green-500 font-medium animate-in fade-in slide-in-from-left-1">
          Copied!
        </span>
      )}
    </button>

    <button
      type="button"
      className="flex w-full min-w-0 items-center gap-3 py-2 text-left cursor-pointer group select-text"
      aria-label="Copy phone number"
      onClick={() => onCopy(phone, "phone")}
    >
      <span className="min-w-0 break-all hover:text-blue-500 transition-colors">{phone}</span>
      {copied === "phone" ? (
        <Check size={14} className="text-green-500 animate-in zoom-in" />
      ) : (
        <Copy
          size={14}
          className="text-gray-400 opacity-60 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
        />
      )}
      {copied === "phone" && (
        <span className="text-xs text-green-500 font-medium animate-in fade-in slide-in-from-left-1">
          Copied!
        </span>
      )}
    </button>
  </>
);

export default ContactCard;
