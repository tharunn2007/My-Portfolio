import { useEffect, useRef, useState } from "react";

export default function useCopyFeedback() {
  const [copied, setCopied] = useState("");
  const [copyError, setCopyError] = useState("");
  const timer = useRef(null);
  const request = useRef(0);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      request.current++;
    },
    [],
  );
  const handleCopy = async (text, label) => {
    const current = ++request.current;
    clearTimeout(timer.current);
    setCopied("");
    setCopyError("");
    try {
      await navigator.clipboard.writeText(text);
      if (current !== request.current) return;
      setCopied(label);
      timer.current = setTimeout(() => setCopied(""), 2000);
    } catch {
      if (current === request.current)
        setCopyError("Couldn’t copy. Select the text and copy it manually.");
    }
  };
  return { copied, copyError, handleCopy };
}
