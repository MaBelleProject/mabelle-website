/**
 * Optional customer email: empty is fine; anything typed must look like a real address. The server also
 * checks that the domain exists and receives mail (and shows its own message if it does not).
 */
const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

/** Error message for an optional email field, or null when it is empty or valid. */
export function optionalEmailError(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  if (v.length > 200 || !EMAIL_RE.test(v) || v.includes("..")) return "Enter a valid email address (or leave it empty)";
  return null;
}

/** What to send: the trimmed address, or undefined when left empty. */
export const emailOrUndefined = (value: string | null | undefined) => (value ?? "").trim() || undefined;
