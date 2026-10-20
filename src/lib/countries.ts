// Turns the free-text "Made In" country (e.g. "France", "lebanon", "FR") into an ISO code for its flag.

export interface CountryInfo { code: string; name: string; }

// Common spellings that the standard English region names don't cover.
const ALIASES: Record<string, string> = {
  usa: "US", "u.s.a.": "US", "united states of america": "US", america: "US",
  uk: "GB", "u.k.": "GB", england: "GB", scotland: "GB", wales: "GB", "great britain": "GB", britain: "GB",
  uae: "AE", emirates: "AE", turkey: "TR", korea: "KR", "south korea": "KR", "north korea": "KP",
  holland: "NL", "the netherlands": "NL", "czech republic": "CZ", russia: "RU", "ivory coast": "CI",
  vietnam: "VN", "viet nam": "VN", iran: "IR", syria: "SY", palestine: "PS", taiwan: "TW", "hong kong": "HK",
  myanmar: "MM", burma: "MM",
};

// Retired or pseudo region codes that share a name with a real country (DD = "Germany", FX = "France"…).
const SKIP = new Set(["AN", "BU", "CS", "DD", "DY", "EU", "EZ", "FX", "HV", "NH", "QO", "RH", "SU", "TP", "UK", "UN", "VD", "XA", "XB", "YD", "YU", "ZR", "ZZ"]);

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

let byName: Map<string, string> | null = null;
let displayNames: Intl.DisplayNames | null = null;

function lookup(): Map<string, string> {
  if (byName) return byName;
  byName = new Map(Object.entries(ALIASES));
  try {
    displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    for (let a = 65; a <= 90; a++) {
      for (let b = 65; b <= 90; b++) {
        const code = String.fromCharCode(a, b);
        if (SKIP.has(code)) continue;
        const name = displayNames.of(code);
        const key = name && name !== code ? normalize(name) : null;
        if (key && !byName.has(key)) byName.set(key, code);
      }
    }
  } catch { /* old runtime without Intl.DisplayNames: aliases and ISO codes still work */ }
  return byName;
}

export function countryInfo(madeIn?: string | null): CountryInfo | null {
  const raw = madeIn?.trim();
  if (!raw) return null;
  const map = lookup();
  if (/^[A-Za-z]{2}$/.test(raw) && !ALIASES[normalize(raw)]) {
    const code = raw.toUpperCase();
    if (SKIP.has(code)) return null;
    const name = displayNames?.of(code);
    if (name && name !== code) return { code, name };
  }
  const code = map.get(normalize(raw));
  // Keep the dashboard's spelling ("USA" stays "USA"), just capitalised: "japan" → "Japan".
  return code ? { code, name: raw.replace(/(^|\s)\p{Ll}/gu, m => m.toUpperCase()) } : null;
}

/** "Made in France" — Lebanon gets "Proudly Made in Lebanon". */
export const madeInLabel = (c: CountryInfo) => `${c.code === "LB" ? "Proudly Made" : "Made"} in ${c.name}`;

/** Country per brand, taken from its products (the dashboard keeps a brand's products on the brand's country). */
export function brandCountries(products: { categoryId?: number | null; madeIn: string }[]): Record<number, string> {
  const counts = new Map<number, Map<string, number>>();
  for (const p of products) {
    if (p.categoryId == null || !p.madeIn) continue;
    const c = counts.get(p.categoryId) ?? new Map<string, number>();
    c.set(p.madeIn, (c.get(p.madeIn) ?? 0) + 1);
    counts.set(p.categoryId, c);
  }
  const result: Record<number, string> = {};
  for (const [id, c] of counts) result[id] = [...c].sort((a, b) => b[1] - a[1])[0][0];
  return result;
}
