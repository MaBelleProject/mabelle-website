"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  /** If provided, push to this URL instead of router.back() */
  href?: string;
  /** If provided alongside href, store this element id in sessionStorage so ScrollToTop can scroll to it */
  scrollTarget?: string;
}

export default function BackButton({ href, scrollTarget }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (scrollTarget) sessionStorage.setItem("homeScrollTo", scrollTarget);
    // Use router.back() when there's history (avoids remounting the previous page).
    // Fall back to router.push only when this is the first page in the tab.
    if (window.history.length > 1) {
      router.back();
    } else if (href) {
      router.push(href);
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Go back"
      className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-[var(--sage-light)] transition shrink-0"
    >
      <ArrowLeft className="w-3.5 h-3.5 text-stone-400" />
    </button>
  );
}
