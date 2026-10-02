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
  // Server-side GETs use ISR (60s revalidate) so repeated calls within the same
  // request cycle are deduplicated and subsequent pages load from cache.
  // Browser requests and mutations always bypass cache.
  const isGet = !init?.method || init.method === "GET";
  const cacheOpts = isServer && isGet
    ? ({ next: { revalidate: 60 } } as RequestInit)
    : ({ cache: "no-store" } as RequestInit);

  const res = await fetch(`${base}${path}`, { ...init, headers, ...cacheOpts });
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
export interface Section { id: number; categoryId: number; code: string; name: string; imageUrl?: string | null; subsections: Subsection[]; }
export interface Brand { id: number; code: string; name: string; imageUrl?: string | null; sections: Section[]; }

export interface Product {
  id: number; code: string; name: string; description?: string | null; remarkToCustomer?: string | null;
  status: string; categoryId?: number | null; sectionId?: number | null; subsectionId?: number | null;
  color: string; weightGrams?: string | null; productLenght?: string | null; height?: string | null; width?: string | null;
  sellingPrice: string; imageUrl?: string | null; shelfLife?: string | null;
  suitableAgeValue?: number | null; suitableAgeUnit?: string | null;
  material?: string | null; addOn?: string | null; madeIn: string;
  discountPercentage: string;
  quantity: number; createdAt: string; updatedAt: string;
}

export interface ProductDetail extends Product {
  categoryName?: string | null; sectionName?: string | null; subsectionName?: string | null;
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
  qrCode: string | null; instagramPage: string | null; deliveryCharge: string | null; updatedAt: string | null;
}

export interface PromoCode {
  id: number; code: string; isActive: boolean; welcomePromo: boolean;
  promoDiscountPercentage: string; promoDiscountAmount: string;
  condition?: string | null; categoryId?: number | null; sectionId?: number | null; subsectionId?: number | null;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const storefrontApi = {
  carousel: () => request<CarouselSlide[]>('/carousel'),
  brands: () => request<Brand[]>('/brands'),
  products: (params?: { search?: string; categoryId?: number; sectionId?: number; subsectionId?: number }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    return request<Product[]>(`/products${qs ? `?${qs}` : ''}`);
  },
  product: (id: number) => request<ProductDetail>(`/products/${id}`),
  settings: () => request<Settings | null>('/settings'),
  validatePromo: (code: string, phone?: string) =>
    request<{ valid: boolean; promo: PromoCode | null; message?: string }>(
      `/promo-codes/validate?code=${encodeURIComponent(code)}${phone ? `&phone=${encodeURIComponent(phone)}` : ''}`
    ),
  createOrder: (data: {
    customerId?: number;
    newCustomer?: { name: string; phone: string; email?: string; address?: string; password?: string };
    phoneNumber?: string; address?: string; paymentMethod: string; remark?: string;
    procodeId?: number; items: { productId: number; productCode: string; productName: string; unitPrice: number; quantity: number }[];
    orderType?: string;
  }) => request<{ id: number; orderNumber: string; netTotal: string }>('/orders', {
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
