import { notFound } from "next/navigation";
import Link from "next/link";
import { storefrontApi, fileUrl } from "@/lib/api";
import GiftCustomizer from "./gift-customizer";
import { Gift } from "lucide-react";

interface PageProps { params: Promise<{ id: string }> }

export default async function GiftPage({ params }: PageProps) {
  const { id } = await params;
  const [gift, packagings] = await Promise.all([
    storefrontApi.gift(parseInt(id)).catch(() => null),
    storefrontApi.giftPackaging().catch(() => []),
  ]);
  if (!gift) notFound();
  const imgUrl = fileUrl(gift.imageUrl);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <nav className="text-xs text-stone-400 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-[var(--brand)]">Home</Link>
        <span>/</span>
        <Link href="/gifts" className="hover:text-[var(--brand)]">Gifts</Link>
        <span>/</span>
        <span className="text-stone-600">{gift.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-50">
            {imgUrl ? (
              <img src={imgUrl} alt={gift.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-300"><Gift className="w-24 h-24" /></div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800">{gift.name}</h1>
          {gift.description && <p className="text-stone-600 text-sm leading-relaxed">{gift.description}</p>}
          <GiftCustomizer gift={gift} packagings={packagings} />
        </div>
      </div>
    </div>
  );
}
