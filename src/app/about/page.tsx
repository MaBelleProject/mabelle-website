import { storefrontApi } from "@/lib/api";
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
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">About MaBelle Bites</h1>
        {settings?.slogan && (
          <p className="text-[var(--brand)] font-medium mt-1 italic">{settings.slogan}</p>
        )}
      </div>

      {/* About content */}
      <div className="text-stone-700 text-base leading-relaxed space-y-6">
        <h2 className="text-2xl font-bold text-stone-800">Little Bites, Big Love!</h2>

        <p>
          MaBelle Bites was born from a mother&apos;s love and a simple wish: <strong>to give our little ones snacks that are both delicious and made with better ingredients.</strong>
        </p>
        <p>
          As parents, we all want the best for our children. But finding snacks that are tasty, fun, and made with ingredients we can feel good about isn&apos;t always easy. That&apos;s why MaBelle Bites was created!
        </p>
        <p>
          We carefully select products from trusted brands, bringing you a variety of <strong>organic, no-added-sugar, and better-for-you snack options</strong> that little ones will love and parents can feel confident choosing.
        </p>
        <p>
          From crunchy chips and yummy biscuits to colorful lollipops, gummies, and convenient ready-to-mix meals, we believe that healthier choices should never mean missing out on fun or flavor!
        </p>

        <h2 className="text-2xl font-bold text-stone-800 mt-10">Why MaBelle Bites?</h2>

        <div className="flex flex-col gap-3">
          <p>🌿 <strong>Better Ingredients</strong> – We look for products made with thoughtfully selected ingredients.</p>
          <p>🍭 <strong>Happy Little Tummies</strong> – Delicious treats that make snack time exciting.</p>
          <p>💚 <strong>Chosen with Love</strong> – Every product is selected with the same care we&apos;d give our own children.</p>
          <p>👩‍👧‍👦 <strong>Made for Families</strong> – Making it easier for busy parents to discover better snack options for their little ones.</p>
        </div>

        <h2 className="text-2xl font-bold text-stone-800 mt-10">Our Little Mission</h2>

        <p>
          To make better snacking simple, accessible, and full of joy, because we believe every little bite matters.
        </p>
        <p>
          <strong>From one parent to another, welcome to the MaBelle Bites family! 💚</strong>
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-stone-100 my-14" />

      {/* Contact / Social */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-7 py-3.5 rounded-full font-semibold transition"
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
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white px-7 py-3.5 rounded-full font-semibold transition"
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
