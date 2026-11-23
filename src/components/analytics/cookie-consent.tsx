"use client";

import { GA_MEASUREMENT_ID, getStoredConsent, setConsent, type ConsentChoice } from "@/lib/analytics";
import { statConsent } from "@/lib/site-stats";
import { useEffect, useRef, useState } from "react";

/**
 * Asks once whether analytics cookies may be used. Until the visitor accepts, Google Analytics runs in
 * cookieless mode (Consent Mode v2, analytics_storage = denied). The choice is kept in this browser and can be
 * changed later through `openCookieSettings()`.
 *
 * Each explicit Accept / Decline click is also counted once in the anonymous first-party statistics
 * (no identifier). The banner only opens while no choice is stored, so a reload does not count again.
 */
export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  /** One count per time the banner is shown, even if a fast double tap fires twice before it closes. */
  const answered = useRef(false);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;
    if (getStoredConsent() === null) setOpen(true);
    const reopen = () => { answered.current = false; setOpen(true); };
    window.addEventListener("mabelle:open-cookie-settings", reopen);
    return () => window.removeEventListener("mabelle:open-cookie-settings", reopen);
  }, []);

  if (!open) return null;

  const choose = (choice: ConsentChoice) => {
    if (answered.current) return;
    answered.current = true;
    setConsent(choice);
    statConsent(choice === "granted" ? "accepted" : "declined");
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed z-[240] left-4 right-4 sm:right-auto sm:left-6 sm:max-w-sm"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="bg-white rounded-2xl border border-[var(--sage-light)] shadow-lg p-4">
        <p className="text-sm text-stone-700">
          We use cookies to understand how visitors use our website, so we can improve it. No personal details are shared.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => choose("granted")}
            className="flex-1 py-2 rounded-full bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold transition"
          >
            Accept
          </button>
          <button
            onClick={() => choose("denied")}
            className="flex-1 py-2 rounded-full border border-stone-200 text-stone-600 hover:bg-[var(--sage-light)] text-sm font-medium transition"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
