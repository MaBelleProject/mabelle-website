"use client";

import { useCustomer } from "@/context/customer-context";

/** "Hello, Name" for small screens, where the header has no room for it (desktop shows it in the header). */
export default function MobileGreeting() {
  const { customer } = useCustomer();
  if (!customer) return null;
  return (
    <p className="sm:hidden max-w-7xl mx-auto px-4 pt-3 text-sm text-stone-500 truncate">
      Hello, <span className="font-semibold text-stone-800">{customer.name.split(" ")[0]}</span> 👋
    </p>
  );
}
