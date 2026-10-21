"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const navigate = () => {
    const q = query.trim();
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") navigate();
  };

  return (
    <section className="max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* Icon + input share a single container; clicking anywhere focuses the input */}
      <label className="flex items-center gap-2 w-full max-w-lg px-4 py-2.5 rounded-full border border-[var(--sage-light)] bg-white cursor-text transition hover:border-stone-300 focus-within:border-[var(--brand)] focus-within:ring-1 focus-within:ring-[var(--brand)]">
        <Search className="w-4 h-4 text-stone-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search products, sections, brands…"
          className="flex-1 min-w-0 bg-transparent outline-none text-sm text-stone-800 placeholder:text-stone-400"
        />
      </label>
    </section>
  );
}
