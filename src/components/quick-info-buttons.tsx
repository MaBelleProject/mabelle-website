"use client";

import { BadgePercent, Banknote, Gift, MessageCircle, Truck, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface Props {
  /** Delivery charge and contact number come from the company settings (dashboard). */
  deliveryCharge: string | null | undefined;
  phoneNumber: string | null | undefined;
  hasOffers: boolean;
}

const tile = "flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-[var(--cream)] border border-[var(--brand-light)] px-1.5 py-3 text-center text-[11px] sm:text-sm font-semibold text-stone-700 leading-tight hover:shadow-md hover:border-[var(--brand)] transition";
const iconWrap = "w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center";
const icon = "w-[18px] h-[18px] sm:w-5 sm:h-5 text-[var(--brand)]";

function money(v: string | null | undefined) {
  const n = parseFloat(String(v ?? ""));
  if (!Number.isFinite(n)) return null;
  return `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

function Popup({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs px-6 py-6 text-center" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--sage-light)] transition">
          <X className="w-4 h-4 text-stone-500" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default function QuickInfoButtons({ deliveryCharge, phoneNumber, hasOffers }: Props) {
  const [popup, setPopup] = useState<"delivery" | "cash" | null>(null);
  const charge = money(deliveryCharge);
  const whatsapp = (phoneNumber ?? "").replace(/\D/g, "");

  const scrollToOffers = () => document.getElementById("offers-area")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section className="max-w-7xl mx-auto px-2 sm:px-4 pb-6">
      <div className={`grid gap-2 sm:gap-3 ${hasOffers ? "grid-cols-4" : "grid-cols-3"}`}>
        <button type="button" onClick={() => setPopup("delivery")} className={tile}>
          <span className={iconWrap}><Truck className={icon} /></span>
          Delivery
        </button>
        <button type="button" onClick={() => setPopup("cash")} className={tile}>
          <span className={iconWrap}><Banknote className={icon} /></span>
          Cash on Delivery
        </button>
        {hasOffers && (
          <button type="button" onClick={scrollToOffers} className={tile}>
            <span className={iconWrap}><BadgePercent className={icon} /></span>
            Special Offers
          </button>
        )}
        <Link href="/bundles" className={tile}>
          <span className={iconWrap}><Gift className={icon} /></span>
          Bundles
        </Link>
      </div>

      {popup === "delivery" && (
        <Popup title="Delivery" onClose={() => setPopup(null)}>
          <span className={`${iconWrap} mx-auto mb-3`}><Truck className={icon} /></span>
          <p className="font-bold text-stone-800">{charge ? `Delivery across Lebanon – ${charge}` : "Delivery across Lebanon"}</p>
        </Popup>
      )}
      {popup === "cash" && (
        <Popup title="Cash on Delivery" onClose={() => setPopup(null)}>
          <span className={`${iconWrap} mx-auto mb-3`}><Banknote className={icon} /></span>
          <p className="text-sm text-stone-700 leading-relaxed">
            <span className="font-bold text-stone-800">Cash on Delivery is available!</span> Prefer to pay with Whish? Contact us on WhatsApp and we&apos;ll send you the number to transfer your payment.
          </p>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-semibold px-5 py-2.5 transition"
            >
              <MessageCircle className="w-4 h-4" /> Contact us on WhatsApp
            </a>
          )}
        </Popup>
      )}
    </section>
  );
}
