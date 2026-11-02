"use client";

/**
 * Printable order voucher — a small payslip-style invoice built only from the saved order (its own amounts,
 * never recalculated). Print it, download it as a PDF, or share the PDF (e.g. to WhatsApp) from a phone.
 * The same component is used by the dashboard and the website.
 */

import { useRef, useState, useSyncExternalStore } from "react";
import { Download, Loader2, Printer, Share2 } from "lucide-react";

export interface VoucherLine {
  name: string;
  itemType: "product" | "bundle" | "gift";
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  /** Bundle / gift contents for the whole line (per-unit quantity × line quantity). */
  components: { name: string; quantity: number; perUnit: number }[];
  packaging?: { name: string; price: number } | null;
  giftMessage?: string | null;
  remark?: string | null;
}

export interface VoucherOrder {
  orderNumber: string;
  orderDate: string;
  status: string;
  customerName: string | null;
  customerCode?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  paymentMethod: string;
  deliveryCompany?: string | null;
  remark?: string | null;
  lines: VoucherLine[];
  subtotal: number;
  offers: { name: string; amount: number; freeDelivery: boolean }[];
  /** Taken off by offers in total (used when the per-offer amounts are not known). */
  offerDiscount: number;
  clientDiscount: number;
  orderDiscount: number;
  promoCode?: string | null;
  promoDiscount: number;
  pointsUsed: number;
  pointsDiscount: number;
  deduction: number;
  additionalCharge: number;
  netTotal: number;
  deliveryCharge: number;
  deliveryDue: number;
  totalDue: number;
}

const noSubscribe = () => () => {};
let shareSupport: boolean | undefined;
/** Whether this browser can share a PDF file (Web Share API level 2) — checked once. */
function canShareFiles() {
  if (shareSupport === undefined) {
    try {
      const probe = new File([new Blob(["x"], { type: "application/pdf" })], "voucher.pdf", { type: "application/pdf" });
      shareSupport = !!navigator.canShare?.({ files: [probe] });
    } catch { shareSupport = false; }
  }
  return shareSupport;
}

const money = (n: number) => `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const C = {
  brand: "#517c41", ink: "#1f2937", muted: "#6b7280", faint: "#9ca3af", line: "#e5e7eb", soft: "#f3f7f1", green: "#15803d",
};

/** Discounts and charges in the order they were applied (the order's saved amounts). */
function summaryRows(o: VoucherOrder): { label: string; value: string; discount?: boolean }[] {
  const itemOffers = o.offers.filter(x => !x.freeDelivery && x.amount > 0);
  const rows: ({ label: string; value: string; discount?: boolean } | null)[] = [
    { label: "Subtotal", value: money(o.subtotal) },
    ...(itemOffers.length
      ? itemOffers.map(x => ({ label: `Offer: ${x.name}`, value: `-${money(x.amount)}`, discount: true }))
      : o.offerDiscount > 0 ? [{ label: "Offer discount", value: `-${money(o.offerDiscount)}`, discount: true }] : []),
    o.clientDiscount > 0 ? { label: "Client discount", value: `-${money(o.clientDiscount)}`, discount: true } : null,
    o.orderDiscount > 0 ? { label: "Order discount", value: `-${money(o.orderDiscount)}`, discount: true } : null,
    o.promoDiscount > 0 ? { label: `Promo code${o.promoCode ? ` (${o.promoCode})` : ""}`, value: `-${money(o.promoDiscount)}`, discount: true } : null,
    o.pointsDiscount > 0 ? { label: `Points used (${o.pointsUsed} pts)`, value: `-${money(o.pointsDiscount)}`, discount: true } : null,
    o.deduction > 0 ? { label: "Other deduction", value: `-${money(o.deduction)}`, discount: true } : null,
    o.additionalCharge > 0 ? { label: "Additional charge", value: `+${money(o.additionalCharge)}` } : null,
  ];
  return rows.filter((r): r is NonNullable<typeof r> => !!r);
}

export function OrderVoucher({ order, logoUrl, companyName = "MaBelle Bites" }: { order: VoucherOrder; logoUrl?: string | null; companyName?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"pdf" | "share" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
  // Phones that can share files (WhatsApp...) get a Share button; known only in the browser (false while rendering on the server)
  const canShare = useSyncExternalStore(noSubscribe, canShareFiles, () => false);
  const fileName = `MaBelle-Voucher-${order.orderNumber}.pdf`;

  /** The voucher as a one-page PDF (the page is as long as the voucher, like a receipt). */
  const makePdf = async () => {
    const node = ref.current;
    if (!node) throw new Error("Voucher not ready");
    const [{ domToCanvas }, { jsPDF }] = await Promise.all([import("modern-screenshot"), import("jspdf")]);
    const canvas = await domToCanvas(node, { scale: 2, backgroundColor: "#ffffff" });
    const width = 120; // mm
    const height = (canvas.height / canvas.width) * width;
    const pdf = new jsPDF({ unit: "mm", format: [width, height], orientation: height > width ? "portrait" : "landscape" });
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, width, height);
    pdf.setProperties({ title: `Voucher ${order.orderNumber}`, author: companyName });
    return pdf;
  };

  const download = async () => {
    setBusy("pdf"); setError(null);
    try { (await makePdf()).save(fileName); }
    catch { setError("Could not create the PDF. Please try Print → Save as PDF instead."); }
    finally { setBusy(null); }
  };

  const share = async () => {
    setBusy("share"); setError(null);
    try {
      const blob = (await makePdf()).output("blob");
      const file = new File([blob], fileName, { type: "application/pdf" });
      await navigator.share({ files: [file], title: `Voucher ${order.orderNumber}`, text: `${companyName} — order ${order.orderNumber}` });
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") setError("Sharing is not available here. Download the PDF and send it instead.");
    } finally { setBusy(null); }
  };

  const date = new Date(order.orderDate);
  const dateText = Number.isNaN(date.getTime()) ? order.orderDate : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const deliveryOffer = order.offers.find(x => x.freeDelivery);
  const rows = summaryRows(order);
  const btn = "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60";

  return (
    <div className="w-full">
      {/* Only the voucher is printed */}
      <style>{`@media print {
        body * { visibility: hidden !important; }
        .voucher-print-area, .voucher-print-area * { visibility: visible !important; }
        .voucher-print-area { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: 0 !important; }
        @page { margin: 10mm; }
      }`}</style>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-4 print:hidden">
        <button type="button" onClick={() => window.print()} className={`${btn} bg-white border border-stone-200 text-stone-700 hover:bg-stone-50`}>
          <Printer className="w-4 h-4" /> Print
        </button>
        <button type="button" onClick={download} disabled={!!busy} className={`${btn} text-white`} style={{ background: C.brand }}>
          {busy === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download PDF
        </button>
        {canShare && (
          <button type="button" onClick={share} disabled={!!busy} className={`${btn} text-white`} style={{ background: "#25D366" }}>
            {busy === "share" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} Share (WhatsApp…)
          </button>
        )}
      </div>
      {error && <p className="text-center text-sm text-red-600 mb-3 print:hidden">{error}</p>}

      {/* The voucher itself: plain inline colours so the PDF capture and print look exactly like the screen */}
      <div
        ref={ref}
        className="voucher-print-area mx-auto w-full max-w-[460px] rounded-2xl"
        style={{ background: "#ffffff", color: C.ink, border: `1px solid ${C.line}`, boxShadow: "0 1px 3px rgba(0,0,0,.06)", padding: 20, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 13, lineHeight: 1.4 }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", paddingBottom: 12, borderBottom: `2px solid ${C.brand}` }}>
          {logoUrl && !logoFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={companyName} onError={() => setLogoFailed(true)} style={{ height: 56, maxWidth: 200, objectFit: "contain", margin: "0 auto 6px", display: "block" }} />
          ) : (
            <div style={{ fontSize: 22, fontWeight: 700, color: C.brand, letterSpacing: 0.5 }}>{companyName}</div>
          )}
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: C.muted }}>Order Voucher</div>
        </div>

        {/* Order + customer */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: `1px dashed ${C.line}`, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: C.muted }}>Order</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{order.orderNumber}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{dateText} · {cap(order.status)}</div>
          </div>
          <div style={{ textAlign: "right", minWidth: 0, flex: "1 1 160px" }}>
            <div style={{ fontSize: 11, color: C.muted }}>Customer</div>
            <div style={{ fontWeight: 600, overflowWrap: "anywhere" }}>{order.customerName ?? "—"}{order.customerCode ? <span style={{ color: C.faint, fontWeight: 400 }}> · {order.customerCode}</span> : null}</div>
            {order.phone && <div style={{ fontSize: 12 }}>{order.phone}</div>}
            {order.email && <div style={{ fontSize: 12, overflowWrap: "anywhere" }}>{order.email}</div>}
          </div>
        </div>
        {(order.address || order.deliveryCompany || order.paymentMethod) && (
          <div style={{ padding: "8px 0", borderBottom: `1px dashed ${C.line}`, fontSize: 12 }}>
            {order.address && <div style={{ overflowWrap: "anywhere" }}><span style={{ color: C.muted }}>Address: </span>{order.address}</div>}
            {order.deliveryCompany && <div><span style={{ color: C.muted }}>Delivery: </span>{order.deliveryCompany}</div>}
            <div><span style={{ color: C.muted }}>Payment: </span>{order.paymentMethod}</div>
          </div>
        )}

        {/* Items */}
        <div style={{ padding: "8px 0", borderBottom: `1px dashed ${C.line}` }}>
          <div style={{ display: "flex", fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, paddingBottom: 4 }}>
            <span style={{ flex: 1 }}>Item</span><span style={{ width: 90, textAlign: "right" }}>Qty × Price</span><span style={{ width: 70, textAlign: "right" }}>Total</span>
          </div>
          {order.lines.map((l, i) => (
            <div key={i} style={{ padding: "6px 0", borderTop: i ? `1px solid ${C.soft}` : undefined }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                <span style={{ flex: 1, minWidth: 0, fontWeight: 600, overflowWrap: "anywhere" }}>
                  {l.itemType !== "product" && <span style={{ fontSize: 10, fontWeight: 700, color: C.brand, textTransform: "uppercase", marginRight: 4 }}>{l.itemType}</span>}
                  {l.name}
                </span>
                <span style={{ width: 90, textAlign: "right", whiteSpace: "nowrap", color: C.muted }}>{l.quantity} × {money(l.unitPrice)}</span>
                <span style={{ width: 70, textAlign: "right", whiteSpace: "nowrap", fontWeight: 600 }}>{money(l.total)}</span>
              </div>
              {l.discountPercent > 0 && (
                <div style={{ fontSize: 11, color: C.green }}>Item discount {l.discountPercent}%{l.discountAmount > 0 ? ` (-${money(l.discountAmount)})` : ""}</div>
              )}
              {(l.components.length > 0 || l.packaging || l.giftMessage) && (
                <div style={{ marginTop: 3, paddingLeft: 8, borderLeft: `2px solid ${C.soft}`, fontSize: 11.5, color: C.muted }}>
                  {l.components.map((c, j) => (
                    <div key={j} style={{ overflowWrap: "anywhere" }}>
                      {c.quantity} × {c.name}{l.quantity > 1 ? <span style={{ color: C.faint }}> ({c.perUnit} per {l.itemType})</span> : null}
                    </div>
                  ))}
                  {l.packaging && <div>Packaging: {l.packaging.name}{l.packaging.price > 0 ? ` (${money(l.packaging.price)} each)` : ""}</div>}
                  {l.giftMessage && <div style={{ fontStyle: "italic", whiteSpace: "pre-line", overflowWrap: "anywhere" }}>Card: “{l.giftMessage}”</div>}
                </div>
              )}
              {l.remark && <div style={{ fontSize: 11, color: C.faint, fontStyle: "italic", overflowWrap: "anywhere" }}>{l.remark}</div>}
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ padding: "8px 0" }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "2px 0", color: r.discount ? C.green : C.ink }}>
              <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{r.label}</span><span style={{ whiteSpace: "nowrap" }}>{r.value}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", marginTop: 4, borderTop: `1px solid ${C.line}`, fontWeight: 600 }}>
            <span>Net total</span><span>{money(order.netTotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "2px 0" }}>
            <span style={{ minWidth: 0 }}>Delivery{deliveryOffer && order.deliveryDue < order.deliveryCharge ? <span style={{ color: C.green }}> · {deliveryOffer.name}</span> : null}</span>
            <span style={{ whiteSpace: "nowrap" }}>
              {order.deliveryDue < order.deliveryCharge
                ? <><s style={{ color: C.faint, marginRight: 4 }}>{money(order.deliveryCharge)}</s>{order.deliveryDue > 0 ? `+${money(order.deliveryDue)}` : "Free"}</>
                : order.deliveryCharge > 0 ? `+${money(order.deliveryCharge)}` : "Free"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, padding: "10px 12px", borderRadius: 10, background: C.soft }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Total due</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: C.brand }}>{money(order.totalDue)}</span>
          </div>
        </div>

        {order.remark && (
          <div style={{ fontSize: 12, padding: "6px 0", borderTop: `1px dashed ${C.line}`, overflowWrap: "anywhere", whiteSpace: "pre-line" }}>
            <span style={{ color: C.muted }}>Note: </span>{order.remark}
          </div>
        )}
        <div style={{ textAlign: "center", fontSize: 11, color: C.faint, paddingTop: 10, borderTop: `1px dashed ${C.line}` }}>
          Thank you for choosing {companyName}!
        </div>
      </div>
    </div>
  );
}
