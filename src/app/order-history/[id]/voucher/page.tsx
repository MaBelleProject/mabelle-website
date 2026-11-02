import { Suspense } from "react";
import VoucherView from "./voucher-view";

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
  </div>
);

/** Printable voucher of one of the signed-in customer's orders. */
export default function OrderVoucherPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Spinner />}>
      <VoucherContent params={params} />
    </Suspense>
  );
}

async function VoucherContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VoucherView id={id} />;
}
