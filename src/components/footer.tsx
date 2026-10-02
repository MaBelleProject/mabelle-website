import Link from "next/link";
import { MessageCircle } from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}
import type { Settings } from "@/lib/api";

interface FooterProps { settings: Settings | null; }

export default function Footer({ settings }: FooterProps) {
  const phone = settings?.phoneNumber?.replace(/\D/g, "") ?? "";
  const whatsappHref = phone ? `https://wa.me/${phone}` : undefined;
  const instaHref = settings?.instagramPage ?? undefined;

  return (
    <footer className="bg-stone-900 text-stone-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <p className="text-white font-semibold text-lg mb-2">{settings?.companyName ?? "Mabelle Bites"}</p>
          {settings?.slogan && <p className="text-sm text-stone-400 italic">{settings.slogan}</p>}
          {settings?.companyDescription && (
            <p className="text-sm text-stone-400 mt-3 leading-relaxed">{settings.companyDescription}</p>
          )}
        </div>

        <div>
          <p className="text-white font-semibold mb-3">Quick Links</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white transition">Home</Link></li>
            <li><Link href="/products" className="hover:text-white transition">All Products</Link></li>
            <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
            <li><Link href="/cart" className="hover:text-white transition">Cart</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-white font-semibold mb-3">Connect</p>
          <div className="flex gap-3">
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-2 rounded-full transition"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            )}
            {instaHref && (
              <a
                href={instaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white text-sm px-4 py-2 rounded-full transition"
              >
                <InstagramIcon className="w-4 h-4" /> Instagram
              </a>
            )}
          </div>
          {settings?.phoneNumber && (
            <p className="text-sm text-stone-400 mt-3">📞 {settings.phoneNumber}</p>
          )}
        </div>
      </div>
      <div className="border-t border-stone-800 py-4 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} {settings?.companyName ?? "Mabelle Bites"}. All rights reserved.
      </div>
    </footer>
  );
}
