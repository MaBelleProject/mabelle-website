"use client";

import { useEffect, useState } from "react";
import BackButton from "@/components/back-button";
import { OrderVoucher, type VoucherOrder } from "@/components/order-voucher";
import { useRequireCustomer } from "@/context/customer-context";
import { storefrontApi, type CustomerOrderDetail } from "@/lib/api";

const n = (v: string | number | null | undefined) => Number(v ?? 0) || 0;

/** The saved order in the voucher's shape (amounts as stored on the order — nothing is recalculated). */
function toVoucher(o: CustomerOrderDetail): VoucherOrder {
  return {
    orderNumber: o.orderNumber,
    orderDate: o.orderDate ?? o.createdAt,
    status: o.status,
    customerName: o.customerName,
    customerCode: o.customerCode,
    phone: o.phoneNumber,
    email: o.customerEmail,
    address: o.address,
    paymentMethod: o.paymentMethod,
    deliveryCompany: o.deliveryCompany,
    remark: o.remark,
    lines: o.items.map(i => ({
      name: i.productName,
      itemType: i.itemType,
      quantity: i.quantity,
      unitPrice: n(i.unitPrice),
      discountPercent: n(i.productDiscountper),
      discountAmount: n(i.productDiscountamount),
      total: n(i.totalPrice),
      components: (i.components ?? []).map(c => ({ name: c.productName, quantity: c.quantity * i.quantity, perUnit: c.quantity })),
      packaging: i.packagingName ? { name: i.packagingName, price: n(i.packagingPrice) } : null,
      giftMessage: i.giftMessage,
      remark: i.remark,
    })),
    subtotal: n(o.subtotal),
    offers: o.offers.map(x => ({ name: x.offerName, amount: n(x.discountAmount), freeDelivery: x.offerType === "free_delivery" })),
    offerDiscount: n(o.offerDiscountAmount),
    clientDiscount: n(o.clientDiscountAmount),
    orderDiscount: n(o.orderDiscountAmount),
    promoCode: o.promoCode,
    promoDiscount: n(o.promoCodeAmount),
    pointsUsed: o.loyaltyPointsUsed,
    pointsDiscount: n(o.loyaltyDiscountAmount),
    deduction: n(o.deductionAmount),
    additionalCharge: n(o.additionalCharge),
    netTotal: n(o.netTotal),
    deliveryCharge: n(o.deliveryCharge),
    deliveryDue: n(o.deliveryDue),
    totalDue: n(o.totalDue),
  };
}

export default function VoucherView({ id }: { id: string }) {
  // Signed-in customers only; the server only returns the customer's own orders
  const { customer } = useRequireCustomer();
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) return;
    const orderId = Number(id);
    if (!Number.isInteger(orderId) || orderId <= 0) { setError("Order not found."); return; }
    storefrontApi.customerOrder(customer.id, orderId)
      .then(setOrder)
      .catch(() => setError("Order not found."));
  }, [customer?.id, id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-16">
      <div className="flex items-center gap-3 mb-5 print:hidden">
        <BackButton href="/order-history" />
        <h1 className="text-xl font-bold text-stone-800">Order Voucher</h1>
      </div>
      {error ? (
        <p className="text-center text-stone-500 py-16">{error}</p>
      ) : !order ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <OrderVoucher order={toVoucher(order)} logoUrl="/api/logo" />
      )}
    </div>
  );
}
