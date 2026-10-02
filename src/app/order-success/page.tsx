import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Suspense } from "react";

function SuccessContent({ orderNumber, total }: { orderNumber: string | null; total: string | null }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      <h1 className="text-3xl font-bold text-stone-800 mb-2">Order Placed!</h1>
      <p className="text-stone-500 mb-6">
        Thank you! Your order has been received and is being processed.
      </p>
      {orderNumber && (
        <div className="bg-stone-50 rounded-2xl px-6 py-4 mb-6 inline-block">
          <p className="text-xs text-stone-400 mb-1">Order Number</p>
          <p className="text-lg font-bold text-stone-800">{orderNumber}</p>
          {total && <p className="text-[var(--brand)] font-semibold mt-1">${parseFloat(total).toFixed(2)}</p>}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-semibold rounded-full transition"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

async function SuccessPage({ searchParams }: { searchParams: Promise<{ orderNumber?: string; total?: string }> }) {
  const { orderNumber, total } = await searchParams;
  return (
    <Suspense>
      <SuccessContent orderNumber={orderNumber ?? null} total={total ?? null} />
    </Suspense>
  );
}

export default SuccessPage;
