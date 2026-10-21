import { cachedStorefrontApi } from "@/lib/cached-storefront";
import { cacheLife } from "next/cache";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

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
  'use cache';
  cacheLife('hours');
  const settings = await cachedStorefrontApi.settings().catch(() => null);

  const phone = settings?.phoneNumber?.replace(/\D/g, "") ?? "";
  const whatsappHref = phone ? `https://wa.me/${phone}` : null;
  const instaHref = settings?.instagramPage ?? null;
  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6">
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
            <WhatsAppIcon className="w-5 h-5" />
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
