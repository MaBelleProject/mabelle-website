// Server components call the backend directly; browser code goes through /api/storefront/*.
const SERVER_BASE = process.env.API_URL;
const CLIENT_BASE = "/api/storefront";

export const fileUrl = (path?: string | null): string | undefined =>
  !path ? undefined : /^https?:/.test(path) ? path : `${process.env.NEXT_PUBLIC_API_URL}${path}`;

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function readError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const body = JSON.parse(text);
    const m = body.message;
    return Array.isArray(m) ? m.join(", ") : (m ?? text);
  } catch { return text || res.statusText; }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isServer = typeof window === "undefined";
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string>) };
  if (!(init?.body instanceof FormData)) headers["Content-Type"] = "application/json";

  const base = isServer ? `${SERVER_BASE}/storefront` : CLIENT_BASE;
  const res = await fetch(`${base}${path}`, { ...init, headers, cache: "no-store" });
  if (!res.ok) throw new ApiError(res.status, await readError(res));
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CarouselSlide {
  id: number; position: number; isActive: boolean;
  imageUrl: string; title?: string | null; description?: string | null; buttonText?: string | null;
  destinationType?: string | null; destinationId?: number | null;
  createdAt: string; updatedAt: string;
}

export interface Subsection { id: number; sectionId: number; code: string; name: string; imageUrl?: string | null; }
export interface Section { id: number; categoryId: number; code: string; name: string; imageUrl?: string | null; displayOrder: number; subsections: Subsection[]; }
export interface Brand { id: number; code: string; name: string; imageUrl?: string | null; displayOrder: number; sections: Section[]; }

/** A website section: every brand's section with the same code, shown together. */
export interface SectionGroup {
  code: string; name: string; imageUrl?: string | null;
  displayOrder: number;
  sectionIds: number[];
  brands: { id: number; name: string }[];
  subsections: Subsection[];
}

export interface Product {
  id: number; code: string; name: string; description?: string | null; remarkToCustomer?: string | null;
  status: string; categoryId?: number | null; sectionId?: number | null; subsectionId?: number | null;
  color: string; weightGrams?: string | null; productLenght?: string | null; height?: string | null; width?: string | null;
  sellingPrice: string; imageUrl?: string | null; shelfLife?: string | null; shelfLifeUnit?: string | null;
  suitableAgeValue?: number | null; suitableAgeUnit?: string | null;
  material?: string | null; addOn?: string | null; madeIn: string;
  discountPercentage: string;
  quantity: number; createdAt: string; updatedAt: string;
}

export interface ProductDetail extends Product {
  categoryName?: string | null; sectionName?: string | null; subsectionName?: string | null;
  sectionCode?: string | null;
  ingredients: { id: number; name: string; percentage: string }[];
  specifications: {
    id: number; name: string; specType: 'boolean' | 'numeric' | 'text';
    unit?: string | null; valueBoolean?: boolean | null; valueNumeric?: string | null; valueText?: string | null;
  }[];
}

export interface Settings {
  id: number | null; projectId: number;
  companyName: string | null; slogan: string | null; companyLogo: string | null;
  companyDescription: string | null; phoneNumber: string | null;
  instagramQrCode: string | null; whatsappQrCode: string | null; instagramPage: string | null; deliveryCharge: string | null; updatedAt: string | null;
  /** Show "Only X left" on product cards and pages (set in the dashboard). */
  showStockLeft?: boolean;
}

export interface PromoCode {
  id: number; code: string; isActive: boolean; welcomePromo: boolean;
  promoDiscountPercentage: string; promoDiscountAmount: string;
  condition?: string | null; categoryId?: number | null; sectionId?: number | null; subsectionId?: number | null;
}

export interface BundleItem {
  id: number; productId: number; quantity: number;
  productCode: string; productName: string; sellingPrice: string; imageUrl?: string | null; stock: number;
}

/** A fixed set of products sold together at one price. */
export interface Bundle {
  id: number; code: string; name: string; description?: string | null; imageUrl?: string | null;
  price: string; items: BundleItem[];
  /** The contents at their own prices (to show the saving). */
  itemsValue: string;
  /** How many can be ordered with the current stock. */
  available: number;
}

export interface GiftProduct {
  id: number; code: string; name: string; sellingPrice: string; imageUrl?: string | null; status: string; stock: number;
}

export interface GiftSlot {
  id: number; productId: number; quantity: number;
  isCustomizable: boolean; maxQuantity: number | null;
  product: GiftProduct;
  /** Products the customer may swap this slot to. */
  options: GiftProduct[];
}

export interface GiftPackage {
  id: number; code: string; name: string; description?: string | null; imageUrl?: string | null;
  items: GiftSlot[];
  /** Price of the default contents (packaging not included). */
  defaultPrice: string;
}

export interface GiftPackaging {
  id: number; name: string; imageUrl?: string | null; price: string;
  /** Boxes in stock; 0 or less = out of stock (can't be ordered). */
  stock: number;
}

export interface Offer {
  id: number; name: string; description?: string | null;
  offerType: 'buy_x_get_y' | 'free_delivery' | 'fixed_discount' | 'percentage_discount';
  appliesToAll: boolean; productIds: number[];
  products: { id: number; code: string; name: string }[];
  minOrderAmount: string; minQuantity: number;
  buyQuantity: number | null; getQuantity: number | null;
  discountAmount: string; discountPercentage: string;
  startDate: string | null; endDate: string | null;
  combinable: boolean;
  /** 1 = highest priority (0 = not set, ranks last); only the highest-priority applicable offer is applied. API returns offers in this order. */
  priority: number;
}

/** One cart line as the order API expects it. */
export type OrderLine =
  | { itemType?: 'product'; productId: number; productCode: string; productName: string; unitPrice: number; quantity: number }
  | { itemType: 'bundle'; bundleId: number; quantity: number }
  | {
    itemType: 'gift'; giftPackageId: number; quantity: number;
    giftSelections: { giftItemId: number; productId: number; quantity: number }[];
    packagingId: number | null; giftMessage?: string;
  };

/** Server pricing of a cart: offers applied, bundle / gift prices as they will be charged. */
export interface OrderQuote {
  items: { itemType: string; productName: string; unitPrice: number; quantity: number; totalPrice: number }[];
  subtotal: number; promoCodeAmount: number;
  /** false when the applied offer rules the promo code out; promoNote says why it was limited or not used. */
  promoApplied: boolean; promoNote: string | null;
  offerDiscountAmount: number; deliveryDiscountAmount: number;
  totalCharges: number; netTotal: number;
  /** Delivery is outside netTotal; totalDue = netTotal + deliveryDue is what the customer pays. */
  deliveryCharge: number; deliveryDue: number; totalDue: number;
  offers: { offerId: number; offerName: string; offerType: Offer['offerType']; discountAmount: number }[];
  /** Every offer the cart qualifies for, default (highest priority) first; only one is applied, and the customer may pick it. */
  availableOffers: { offerId: number; offerName: string; offerType: Offer['offerType']; priority: number; discountAmount: number }[];
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const storefrontApi = {
  carousel: () => request<CarouselSlide[]>('/carousel'),
  brands: () => request<Brand[]>('/brands'),
  sections: () => request<SectionGroup[]>('/sections'),
  bestSellers: () => request<Product[]>('/products/best-sellers'),
  products: (params?: { search?: string; categoryId?: number; sectionId?: number; subsectionId?: number; sectionCode?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    return request<Product[]>(`/products${qs ? `?${qs}` : ''}`);
  },
  product: (id: number) => request<ProductDetail>(`/products/${id}`),
  bundles: () => request<Bundle[]>('/bundles'),
  bundle: (id: number) => request<Bundle>(`/bundles/${id}`),
  gifts: () => request<GiftPackage[]>('/gifts'),
  gift: (id: number) => request<GiftPackage>(`/gifts/${id}`),
  giftPackaging: () => request<GiftPackaging[]>('/gifts/packaging'),
  offers: () => request<Offer[]>('/offers'),
  quote: (data: { customerId?: number; procodeId?: number; selectedOfferId?: number; items: OrderLine[] }) =>
    request<OrderQuote>('/orders/quote', { method: 'POST', body: JSON.stringify(data) }),
  settings: () => request<Settings | null>('/settings'),
  validatePromo: (code: string, phone?: string) =>
    request<{ valid: boolean; promo: PromoCode | null; message?: string }>(
      `/promo-codes/validate?code=${encodeURIComponent(code)}${phone ? `&phone=${encodeURIComponent(phone)}` : ''}`
    ),
  createOrder: (data: {
    customerId?: number;
    newCustomer?: { name: string; phone: string; email?: string; address?: string; password?: string };
    phoneNumber?: string; address?: string; paymentMethod: string; remark?: string;
    procodeId?: number; selectedOfferId?: number; items: OrderLine[];
    orderType?: string;
  }) => request<{ id: number; orderNumber: string; netTotal: string; totalDue: string }>('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  forgotPassword: (phone: string) =>
    request<{ sent: boolean }>('/forgot-password', { method: 'POST', body: JSON.stringify({ phone }) }),
  resetPassword: (token: string, newPassword: string) =>
    request<{ success: boolean }>('/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
  sendChangePasswordCode: (phone: string, currentPassword: string) =>
    request<{ sent: boolean }>('/send-change-password-code', { method: 'POST', body: JSON.stringify({ phone, currentPassword }) }),
  changePassword: (phone: string, currentPassword: string, newPassword: string, code: string) =>
    request<{ success: boolean }>('/change-password', { method: 'POST', body: JSON.stringify({ phone, currentPassword, newPassword, code }) }),
};
