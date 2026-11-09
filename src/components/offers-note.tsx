import { Info } from "lucide-react";

/** Small reminder under the Offers heading. */
export default function OffersNote() {
  return (
    <p className="flex items-center gap-1.5 text-xs text-stone-500 -mt-4 mb-4">
      <Info className="w-3.5 h-3.5 shrink-0 text-[var(--brand)]" /> Only one offer can be applied per order.
    </p>
  );
}
