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
    if (href) {
      if (scrollTarget) sessionStorage.setItem("homeScrollTo", scrollTarget);
      router.push(href);
    } else {
      router.back();
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
