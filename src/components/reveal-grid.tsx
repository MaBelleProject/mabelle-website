"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  className: string;
}

export default function RevealGrid({ children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const items = Array.from(container.children) as HTMLElement[];
    const vh = window.innerHeight;

    const toAnimate: HTMLElement[] = [];
    items.forEach((item, i) => {
      const rect = item.getBoundingClientRect();
      // Only animate items that aren't already fully in the viewport on load
      if (rect.top >= vh - 40) {
        item.style.opacity = "0";
        item.style.transform = "translateY(18px)";
        item.style.transition = `opacity 0.4s ease ${Math.min(i * 55, 500)}ms, transform 0.4s ease ${Math.min(i * 55, 500)}ms`;
        toAnimate.push(item);
      }
    });

    if (!toAnimate.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "none";
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" },
    );

    toAnimate.forEach((item) => obs.observe(item));
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
