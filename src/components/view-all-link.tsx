import Link from "next/link";

/** The "View All" link shown at the right of a homepage section heading. */
export default function ViewAllLink({ href, label = "View All" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="shrink-0 text-sm text-[var(--brand)] font-semibold hover:underline">
      {label} →
    </Link>
  );
}
