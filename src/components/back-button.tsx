"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      aria-label="Go back"
      className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-[var(--sage-light)] transition shrink-0"
    >
      <ArrowLeft className="w-3.5 h-3.5 text-stone-400" />
    </button>
  );
}
