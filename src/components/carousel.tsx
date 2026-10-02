"use client";

import type { CarouselSlide } from "@/lib/api";
import { fileUrl } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface CarouselProps { slides: CarouselSlide[]; }

const SWIPE_THRESHOLD = 50; // px needed to commit a slide change

export default function Carousel({ slides }: CarouselProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragOffset, setDragOffset] = useState(0); // live px offset while dragging
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);   // always current — state lags behind renders
  const wasDraggedRef = useRef(false); // survives until click fires
  const trackRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = slides.length;

  const go = useCallback((index: number) => {
    setCurrent(((index % total) + total) % total);
  }, [total]);

  const next = useCallback(() => go(current + 1), [current, go]);
  const prev = useCallback(() => go(current - 1), [current, go]);

  // Auto-advance
  useEffect(() => {
    if (paused || dragging || total <= 1) return;
    timerRef.current = setInterval(next, 4500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, paused, dragging, total]);

  if (!slides.length) return null;

  // ── drag helpers ──────────────────────────────────────────────────────────

  const startDrag = (clientX: number) => {
    dragStart.current = clientX;
    dragOffsetRef.current = 0;
    wasDraggedRef.current = false;
    setDragging(true);
    setPaused(true);
  };

  const moveDrag = (clientX: number) => {
    if (dragStart.current === null) return;
    const offset = clientX - dragStart.current;
    dragOffsetRef.current = offset;
    if (Math.abs(offset) > 5) wasDraggedRef.current = true;
    setDragOffset(offset);
  };

  const endDrag = () => {
    if (dragStart.current === null) return;
    const offset = dragOffsetRef.current; // use ref — always up-to-date regardless of render timing
    if (offset < -SWIPE_THRESHOLD) next();
    else if (offset > SWIPE_THRESHOLD) prev();
    dragStart.current = null;
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setDragging(false);
    setPaused(false);
  };

  // ── pointer events (mouse + stylus) ──────────────────────────────────────

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startDrag(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    moveDrag(e.clientX); // dragStart.current guard inside moveDrag is sufficient
  };
  const onPointerUp = () => endDrag();

  // ── touch events (for momentum feel on mobile) ────────────────────────────

  const onTouchStart = (e: React.TouchEvent) => startDrag(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => moveDrag(e.touches[0].clientX);
  const onTouchEnd = () => endDrag();

  // ── click vs drag guard ───────────────────────────────────────────────────

  const handleContainerClick = (e: React.MouseEvent) => {
    if ((e.target as Element).closest('button')) return; // dot buttons bubble up — skip
    const slide = slides[current];
    if (wasDraggedRef.current) { wasDraggedRef.current = false; return; }
    if (!slide.destinationType || !slide.destinationId) return;
    switch (slide.destinationType) {
      case "category":
      case "brand":
        router.push(`/brand/${slide.destinationId}`);
        break;
      case "product":
        router.push(`/product/${slide.destinationId}`);
        break;
      case "section":
        router.push(`/products?sectionId=${slide.destinationId}`);
        break;
      case "subsection":
        router.push(`/products?subsectionId=${slide.destinationId}`);
        break;
    }
  };

  // Track width needed to convert px drag to % offset
  const trackWidth = trackRef.current?.offsetWidth ?? 0;
  const dragPct = trackWidth > 0 ? (dragOffset / trackWidth) * 100 : 0;
  const translateX = -(current * 100) + dragPct;

  return (
    <div
      className="relative overflow-hidden rounded-2xl select-none cursor-grab active:cursor-grabbing"
      style={{ aspectRatio: "16/6" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={handleContainerClick}
    >
      {/* Track */}
      <div
        ref={trackRef}
        className="flex h-full"
        style={{
          transform: `translateX(${translateX}%)`,
          // Disable the CSS transition while dragging so the slide follows the finger exactly
          transition: dragging ? "none" : "transform 0.5s ease",
          willChange: "transform",
        }}
      >
        {slides.map((slide) => {
          const url = fileUrl(slide.imageUrl) ?? slide.imageUrl;
          const clickable = !!(slide.destinationType && slide.destinationId);
          return (
            <div
              key={slide.id}
              className={`carousel-slide relative ${clickable ? "cursor-pointer" : ""}`}
            >
              <img
                src={url}
                alt={slide.title ?? ""}
                className="w-full h-full object-cover"
                draggable={false}
              />
              {(slide.title || slide.description || slide.buttonText) && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                  <div className="px-8 sm:px-14 max-w-xl">
                    {slide.title && (
                      <h2 className="text-white text-2xl sm:text-4xl font-bold leading-tight drop-shadow">{slide.title}</h2>
                    )}
                    {slide.description && (
                      <p className="text-white/90 text-sm sm:text-base mt-2 drop-shadow">{slide.description}</p>
                    )}
                    {slide.buttonText && clickable && (
                      <span className="inline-block mt-4 px-5 py-2 bg-[var(--brand)] text-white text-sm font-semibold rounded-full hover:bg-[var(--brand-dark)] transition">
                        {slide.buttonText}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dots */}
      {total > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onPointerDown={e => e.stopPropagation()}
              onClick={() => go(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? "bg-blue-400 w-2" : "bg-white w-2"
                }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
