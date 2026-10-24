"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { useCustomer } from "@/context/customer-context";
import { storefrontApi, type LoyaltySummary } from "@/lib/api";

export default function ProfilePage() {
  const { customer } = useCustomer();
  const router = useRouter();
  const [loyalty, setLoyalty] = useState<LoyaltySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) { router.replace("/login"); return; }
    storefrontApi.loyalty(customer.id)
      .then(setLoyalty)
      .catch(() => setLoyalty(null))
      .finally(() => setLoading(false));
  }, [customer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!customer) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-16 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-stone-800">My Profile</h1>

      <div className="bg-white rounded-2xl border border-[var(--sage-light)] shadow-sm px-5 py-4 grid grid-cols-2 gap-y-2 text-sm">
        <span className="text-stone-400">Name</span><span className="text-stone-700 font-medium">{customer.name}</span>
        <span className="text-stone-400">Phone</span><span className="text-stone-700 font-medium">{customer.phone}</span>
        {customer.email && <><span className="text-stone-400">Email</span><span className="text-stone-700 font-medium break-all min-w-0">{customer.email}</span></>}
      </div>

      <div className="bg-white rounded-2xl border border-[var(--sage-light)] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--sage-light)]">
          <h2 className="font-semibold text-stone-800 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-500" /> My Loyalty Points
          </h2>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-6 h-6 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !loyalty ? (
          <p className="p-5 text-sm text-stone-500">Could not load your loyalty points. Please try again later.</p>
        ) : (
          <div className="p-5 flex flex-col gap-5">
            <div>
              <p className="text-3xl font-bold text-stone-800">{loyalty.availablePoints} <span className="text-base font-medium text-stone-500">Points</span></p>
              <p className="text-sm text-stone-600 mt-1">Value: ${loyalty.availableValue.toFixed(2)}</p>
              <p className="text-xs text-stone-400">{loyalty.pointsPerDollar} Points = $1 Discount · earn 1 point per $1 once your order is delivered</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-[var(--sage-light)] px-4 py-3">
                <p className="text-stone-500 text-xs">Total Earned</p>
                <p className="font-semibold text-stone-800">{loyalty.totalEarned} pts</p>
              </div>
              <div className="rounded-xl bg-[var(--sage-light)] px-4 py-3">
                <p className="text-stone-500 text-xs">Total Redeemed</p>
                <p className="font-semibold text-stone-800">{loyalty.totalRedeemed} pts</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-stone-800 mb-2">Points History</h3>
              {loyalty.history.length === 0 ? (
                <p className="text-sm text-stone-400">No points activity yet.</p>
              ) : (
                <ul className="divide-y divide-[var(--sage-light)] text-sm">
                  {loyalty.history.map(h => (
                    <li key={h.id} className={`flex items-center justify-between py-2.5 ${h.isReversed ? "opacity-50" : ""}`}>
                      <span>
                        <span className={`font-medium ${h.type === "earned" ? "text-green-700" : "text-amber-700"}`}>
                          {h.type === "earned" ? "Earned" : "Redeemed"}
                        </span>
                        <span className="text-stone-500"> · Order {h.orderNumber}</span>
                        {h.isReversed && <span className="text-stone-400"> · reversed</span>}
                        <span className="block text-xs text-stone-400">{new Date(h.createdAt).toLocaleDateString()}</span>
                      </span>
                      <span className={`font-semibold ${h.type === "earned" ? "text-green-700" : "text-amber-700"}`}>
                        {h.type === "earned" ? "+" : "−"}{h.points}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
