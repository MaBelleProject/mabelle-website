import { storefrontApi, fileUrl } from "@/lib/api";
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

export default async function AboutPage() {
  const settings = await storefrontApi.settings().catch(() => null);

  const phone = settings?.phoneNumber?.replace(/\D/g, "") ?? "";
  const whatsappHref = phone ? `https://wa.me/${phone}` : null;
  const instaHref = settings?.instagramPage ?? null;
  const logoUrl = settings?.companyLogo ? fileUrl(settings.companyLogo) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Logo + Name */}
      <div className="flex flex-col items-center text-center mb-10">
        {logoUrl && (
          <img src={logoUrl} alt={settings?.companyName ?? "Mabelle Bites"} className="w-28 h-28 object-contain mb-4" />
        )}
        <h1 className="text-4xl font-bold text-stone-800">{settings?.companyName ?? "Mabelle Bites"}</h1>
        {settings?.slogan && (
          <p className="text-lg text-[var(--brand)] font-medium mt-2 italic">{settings.slogan}</p>
        )}
      </div>

      {/* Description */}
      {settings?.companyDescription ? (
        <div className="prose prose-stone max-w-none text-stone-600 text-base leading-relaxed mb-10">
          {settings.companyDescription.split("\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ) : (
        <p className="text-stone-500 text-center mb-10">
          We craft delicious treats with the finest ingredients, made with love and care.
        </p>
      )}

      {/* Contact / Social */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-semibold transition"
          >
            <MessageCircle className="w-5 h-5" />
            Chat on WhatsApp
          </a>
        )}
        {instaHref && (
          <a
            href={instaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white px-6 py-3 rounded-full font-semibold transition"
          >
            <InstagramIcon className="w-5 h-5" />
            Follow on Instagram
          </a>
        )}
      </div>

      {settings?.phoneNumber && (
        <p className="text-center text-stone-400 text-sm mt-6">📞 {settings.phoneNumber}</p>
      )}
    </div>
  );
}
