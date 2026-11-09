import type { Product } from "@/lib/api";

/** URL value for the "Kids" option (products without a specific minimum age). */
export const KIDS_AGE = "kids";

export interface AgeOption { value: string; label: string; }

/** Minimum age of a product in months (years are converted), or null when it has no specific age. */
export function productAgeMonths(p: Pick<Product, "suitableAgeValue" | "suitableAgeUnit">): number | null {
  const v = Number(p.suitableAgeValue);
  if (!Number.isFinite(v) || v <= 0) return null;
  return p.suitableAgeUnit?.toLowerCase().startsWith("year") ? v * 12 : v;
}

export const ageLabel = (months: number) => `${months} Months+`;

/** Age options built from the products' own ages (numeric order), "Kids" last when some products have no age. */
export function ageOptions(products: Pick<Product, "suitableAgeValue" | "suitableAgeUnit">[]): AgeOption[] {
  const months = new Set<number>();
  let hasKids = false;
  for (const p of products) {
    const m = productAgeMonths(p);
    if (m === null) hasKids = true;
    else months.add(m);
  }
  const options = [...months].sort((a, b) => a - b).map(m => ({ value: String(m), label: ageLabel(m) }));
  if (hasKids) options.push({ value: KIDS_AGE, label: "Kids" });
  return options;
}

/**
 * Does the product suit the selected age? A number means "that many months": products whose minimum age is
 * that or lower. "Kids" means products without a specific age. Numeric comparison, never string.
 */
export function matchesAge(p: Pick<Product, "suitableAgeValue" | "suitableAgeUnit">, age: string | null | undefined): boolean {
  if (!age) return true;
  const m = productAgeMonths(p);
  if (age === KIDS_AGE) return m === null;
  const selected = Number(age);
  if (!Number.isFinite(selected)) return true;
  return m !== null && m <= selected;
}
