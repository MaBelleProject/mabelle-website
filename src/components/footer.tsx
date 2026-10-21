import type { Settings } from "@/lib/api";
import Link from "next/link";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
import { cacheLife } from "next/cache";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

interface FooterProps { settings: Settings | null; }

export default async function Footer({ settings }: FooterProps) {
  'use cache';
  cacheLife('hours');
  const phone = settings?.phoneNumber?.replace(/\D/g, "") ?? "";
  const whatsappHref = phone ? `https://wa.me/${phone}` : undefined;
  const instaHref = settings?.instagramPage ?? undefined;

  return (
    <footer className="bg-[#cfe8ba] text-[#4a6a30] mt-20">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <p className="text-[#3d5c22] font-semibold text-lg mb-2">{settings?.companyName ?? "Mabelle Bites"}</p>
          {settings?.slogan && <p className="text-sm text-[#4a6a30] italic">{settings.slogan}</p>}
          {settings?.companyDescription && (
            <p className="text-sm text-[#4a6a30] mt-3 leading-relaxed">{settings.companyDescription}</p>
          )}
        </div>

        <div>
          <p className="text-[#3d5c22] font-semibold mb-3">Quick Links</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-[#3d5c22] transition">Home</Link></li>
            <li><Link href="/products" className="hover:text-[#3d5c22] transition">All Products</Link></li>
            <li><Link href="/about" className="hover:text-[#3d5c22] transition">About Us</Link></li>
            <li><Link href="/cart" className="hover:text-[#3d5c22] transition">Cart</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-[#3d5c22] font-semibold mb-3">Connect</p>
          <div className="flex gap-3">
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-2 rounded-full transition"
              >
                <WhatsAppIcon className="w-4 h-4" /> WhatsApp
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
            <p className="text-sm text-[#4a6a30] mt-3">📞 {settings.phoneNumber}</p>
          )}
        </div>
      </div>
      <div suppressHydrationWarning className="border-t border-[#b5d49e] py-4 text-center text-xs text-[#4a6a30]">
        © {new Date().getFullYear()} {settings?.companyName ?? "Mabelle Bites"}. All rights reserved.
      </div>
    </footer>
  );
}
