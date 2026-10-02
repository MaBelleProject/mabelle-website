"use client";

import { useMenu } from "@/context/menu-context";
import { useCustomer } from "@/context/customer-context";
import type { Brand } from "@/lib/api";
import { X, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const TRANSITION = "300ms cubic-bezier(0.4, 0, 0.2, 1)";

export default function MenuSidebar({ brands }: { brands: Brand[] }) {
  const { open, close } = useMenu();
  const { customer, logout } = useCustomer();
  const pathname = usePathname();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const sections = brands.flatMap(b => b.sections.map(s => ({ ...s, brandId: b.id })));

  useEffect(() => { close(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close the confirm dialog whenever the sidebar closes
  useEffect(() => { if (!open) setConfirmSignOut(false); }, [open]);

  const handleSignOut = () => {
    logout();
    setConfirmSignOut(false);
    close();
  };

  return (
    <>
      <div
        aria-hidden="true"
        className="shrink-0"
        style={{ width: open ? "18rem" : "0", transition: `width ${TRANSITION}` }}
      />

      <aside
        className="fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 flex flex-col will-change-transform overflow-hidden"
        style={{
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: `transform ${TRANSITION}`,
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Close button row */}
        <div className="flex items-center justify-end px-3 h-16 shrink-0">
          <button
            onClick={close}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-stone-50 transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-stone-600" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-0.5">
          <Link href="/" onClick={close} className="px-4 py-3 rounded-lg text-stone-700 hover:bg-stone-50 hover:text-[var(--brand)] text-sm font-medium transition">
            Home
          </Link>

          {sections.map(s => (
            <Link
              key={s.id}
              href={`/brand/${s.brandId}?section=${s.id}`}
              onClick={close}
              className="px-4 py-3 rounded-lg text-stone-700 hover:bg-stone-50 hover:text-[var(--brand)] text-sm font-medium transition"
            >
              {s.name}
            </Link>
          ))}

          <Link href="/about" onClick={close} className="px-4 py-3 rounded-lg text-stone-700 hover:bg-stone-50 hover:text-[var(--brand)] text-sm font-medium transition">
            About Us
          </Link>

          {customer ? (
            <>
              <Link href="/change-password" onClick={close} className="px-4 py-3 rounded-lg text-stone-700 hover:bg-stone-50 hover:text-[var(--brand)] text-sm font-medium transition">
                Change Password
              </Link>
              <button
                onClick={() => setConfirmSignOut(true)}
                className="px-4 py-3 rounded-lg text-stone-700 hover:bg-stone-50 hover:text-red-500 text-sm font-medium transition text-left flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" onClick={close} className="px-4 py-3 rounded-lg text-stone-700 hover:bg-stone-50 hover:text-[var(--brand)] text-sm font-medium transition">
              Login
            </Link>
          )}
        </nav>

        {/* Sign-out confirmation overlay */}
        {confirmSignOut && (
          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center px-6 gap-5 z-10">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <LogOut className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-stone-800 text-base">Sign out?</p>
              <p className="text-stone-400 text-sm mt-1">You&apos;ll need to log in again at checkout.</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={handleSignOut}
                className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-full transition"
              >
                Yes, sign out
              </button>
              <button
                onClick={() => setConfirmSignOut(false)}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold rounded-full transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
