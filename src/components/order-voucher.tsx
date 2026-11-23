"use client";

/**
 * Printable order voucher — a small payslip-style invoice built only from the saved order (its own amounts,
 * never recalculated). Print it, download it as a PDF, or share the PDF (e.g. to WhatsApp) from a phone.
 * The same component is used by the dashboard and the website.
 */

import { useEffect, useRef, useState } from "react";
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

/** iPhone / iPad (iPadOS reports itself as a Mac, so touch support gives it away). */
const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

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
  const fileName = `MaBelle-Voucher-${order.orderNumber}.pdf`;

  /** The voucher as a one-page PDF (the page is as long as the voucher, like a receipt). */
  const makePdf = async (): Promise<File> => {
    const node = ref.current;
    if (!node) throw new Error("Voucher not ready");
    // Wait for the logo and fonts, or they are missing from the capture (iOS is slow to decode images)
    await Promise.all([
      document.fonts?.ready,
      ...Array.from(node.querySelectorAll("img")).map(img => img.decode?.().catch(() => null)),
    ]);
    const [{ domToCanvas }, { jsPDF }] = await Promise.all([import("modern-screenshot"), import("jspdf")]);
    const canvas = await domToCanvas(node, { scale: 2, backgroundColor: "#ffffff" });
    const width = 120; // mm
    const height = (canvas.height / canvas.width) * width;
    const pdf = new jsPDF({ unit: "mm", format: [width, height], orientation: height > width ? "portrait" : "landscape" });
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, width, height);
    pdf.setProperties({ title: `Voucher ${order.orderNumber}`, author: companyName });
    return new File([pdf.output("blob")], fileName, { type: "application/pdf" });
  };

  /*
   * The PDF is made in the background as soon as the voucher is on screen. iOS (Safari, Chrome, every iOS
   * browser) only lets a page download a file or open the share sheet straight from the tap — after a slow
   * `await` the tap no longer counts and the browser silently does nothing. With the file ready, the buttons
   * act at once, inside the tap.
   */
  const orderKey = JSON.stringify(order);
  const pdfRef = useRef<{ promise: Promise<File>; file: File | null } | null>(null);
  const getPdf = () => {
    if (!pdfRef.current) {
      const entry: { promise: Promise<File>; file: File | null } = { promise: makePdf(), file: null };
      entry.promise.then(f => { entry.file = f; }, () => { if (pdfRef.current === entry) pdfRef.current = null; });
      pdfRef.current = entry;
    }
    return pdfRef.current;
  };
  useEffect(() => {
    pdfRef.current = null; // the order or the logo changed: make it again
    const t = setTimeout(() => { getPdf().promise.catch(() => {}); }, 400);
    return () => clearTimeout(t);
  }, [orderKey, logoFailed]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Saves the file through a download link (desktop, Android, iOS Safari 13+). */
  const saveFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    // iOS reads the file after the click returns, so the link is kept alive for a while
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  /** Opens the system share sheet with the PDF file itself (WhatsApp, Mail, Save to Files...). */
  const shareFile = (file: File) =>
    // Only the file: with extra text, WhatsApp on iOS sends the text and drops the PDF
    navigator.share({ files: [file] });

  const isNotAllowed = (e: unknown) => (e as Error)?.name === "NotAllowedError";
  const isAbort = (e: unknown) => (e as Error)?.name === "AbortError";

  const download = async () => {
    setError(null);
    const entry = getPdf();
    let file = entry.file;
    if (!file) {
      setBusy("pdf");
      try { file = await entry.promise; }
      catch { setError("Could not create the PDF. Please try Print → Save as PDF instead."); return; }
      finally { setBusy(null); }
    }
    // Chrome, Firefox and Edge on iOS can't save a generated file through a link: the share sheet's "Save to Files" can
    const ua = navigator.userAgent;
    const iosSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA/.test(ua);
    if (isIOS() && !iosSafari && canShareFiles()) {
      try { await shareFile(file); return; }
      catch (e) {
        if (isAbort(e)) return;
        if (isNotAllowed(e)) { setError("Your PDF is ready — tap Download PDF again."); return; }
      }
    }
    saveFile(file);
  };

  const share = async () => {
    setError(null);
    const entry = getPdf();
    let file = entry.file;
    if (!file) {
      setBusy("share");
      try { file = await entry.promise; }
      catch { setError("Could not create the PDF. Please try again."); return; }
      finally { setBusy(null); }
    }
    if (!canShareFiles()) {
      // Browser can't share files (e.g. Firefox on a computer): save the PDF and open WhatsApp to attach it
      saveFile(file);
      window.open(`https://wa.me/?text=${encodeURIComponent(`${companyName} — voucher for order ${order.orderNumber}`)}`, "_blank", "noopener");
      return;
    }
    try { await shareFile(file); }
    catch (e) {
      if (isAbort(e)) return;
      // The PDF took too long and the tap expired: it is ready now, so the next tap opens the share sheet at once
      if (isNotAllowed(e)) setError("Your PDF is ready — tap Share again.");
      else setError("Could not open sharing here. Please use Download PDF instead.");
    }
  };

  /**
   * Safari on iOS can't print the page with everything but the voucher hidden (it prints blank or extra pages),
   * so there the voucher is copied into its own hidden frame and that frame is printed. Elsewhere the page
   * itself is printed, as before.
   */
  const print = async () => {
    const node = ref.current;
    if (!node || !isIOS()) { window.print(); return; }
    setError(null);
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;left:0;top:0;width:480px;height:10px;border:0;opacity:0;pointer-events:none;";
    document.body.appendChild(frame);
    const cleanup = () => setTimeout(() => frame.remove(), 60_000);
    try {
      const doc = frame.contentDocument;
      const win = frame.contentWindow;
      if (!doc || !win) throw new Error("no frame");
      doc.open();
      doc.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Voucher ${order.orderNumber}</title>
<style>@page{margin:10mm}html,body{margin:0;padding:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.voucher-print-area{box-sizing:border-box;width:100%;max-width:460px;margin:0 auto;border-radius:16px}.voucher-print-area *{box-sizing:border-box}</style>
</head><body>${node.outerHTML}</body></html>`);
      doc.close();
      // Wait for the logo so it is on the printout
      await Promise.all(Array.from(doc.images).map(img => img.complete ? null : new Promise(r => { img.onload = img.onerror = () => r(null); setTimeout(() => r(null), 4000); })));
      win.focus();
      win.print();
      cleanup();
    } catch {
      frame.remove();
      // No printing from this browser: fall back to the PDF
      download();
    }
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
        <button type="button" onClick={print} className={`${btn} bg-white border border-stone-200 text-stone-700 hover:bg-stone-50`}>
          <Printer className="w-4 h-4" /> Print
        </button>
        <button type="button" onClick={download} disabled={!!busy} className={`${btn} text-white`} style={{ background: C.brand }}>
          {busy === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download PDF
        </button>
        <button type="button" onClick={share} disabled={!!busy} className={`${btn} text-white`} style={{ background: "#25D366" }}>
          {busy === "share" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} Share (WhatsApp…)
        </button>
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
