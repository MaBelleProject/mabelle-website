"use client";

import { useState } from "react";
import { Check, Minus } from "lucide-react";
import type { ProductDetail } from "@/lib/api";
import { trimZeros } from "@/lib/format";

type Tab = "specifications" | "ingredients";

interface Props {
  specifications: ProductDetail["specifications"];
  ingredients: ProductDetail["ingredients"];
}

export default function ProductInfoTabs({ specifications, ingredients }: Props) {
  const [tab, setTab] = useState<Tab>(specifications.length > 0 || ingredients.length === 0 ? "specifications" : "ingredients");

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "specifications", label: "Specifications", count: specifications.length },
    { key: "ingredients", label: "Ingredients", count: ingredients.length },
  ];

  return (
    <div className="mt-10">
      <div role="tablist" aria-label="Product information" className="flex gap-2 border-b border-[var(--sage-light)]">
        {tabs.map(t => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={active}
              aria-controls={`panel-${t.key}`}
              onClick={() => setTab(t.key)}
              className={`relative px-4 sm:px-5 py-2.5 text-sm font-semibold transition -mb-px border-b-2 ${
                active
                  ? "border-[var(--brand)] text-[var(--brand)]"
                  : "border-transparent text-stone-400 hover:text-stone-600"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`ml-1.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${active ? "bg-[var(--cream)]" : "bg-[var(--sage-light)]"}`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="pt-5">
        {tab === "specifications" ? (
          specifications.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-x-8">
              {specifications.map(spec => (
                <SpecRow key={spec.id} spec={spec} />
              ))}
            </div>
          ) : (
            <Empty text="No specifications listed for this product." />
          )
        ) : ingredients.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-x-8">
            {ingredients.map(ing => {
              const pct = parseFloat(ing.percentage);
              return (
                <div key={ing.id} className="flex justify-between items-center py-2.5 border-b border-[var(--sage-light)]">
                  <span className="text-stone-700 text-sm">{ing.name}</span>
                  {pct > 0 && (
                    <span className="text-stone-800 text-sm font-medium ml-4 tabular-nums">{trimZeros(ing.percentage)}%</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <Empty text="No ingredients listed for this product." />
        )}
      </div>
    </div>
  );
}

function SpecRow({ spec }: { spec: ProductDetail["specifications"][number] }) {
  let value: React.ReactNode;
  if (spec.specType === "boolean") {
    value = spec.valueBoolean ? (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--sage-light)]" aria-label="Yes">
        <Check className="w-3.5 h-3.5 text-[var(--sage)]" strokeWidth={3} />
      </span>
    ) : (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--sage-light)]" aria-label="No">
        <Minus className="w-3.5 h-3.5 text-stone-400" strokeWidth={3} />
      </span>
    );
  } else if (spec.specType === "numeric") {
    value = spec.valueNumeric != null ? `${trimZeros(spec.valueNumeric)}${spec.unit ? ` ${spec.unit}` : ""}` : "—";
  } else {
    value = spec.valueText || "—";
  }

  return (
    <div className="flex justify-between items-center py-2.5 border-b border-[var(--sage-light)]">
      <span className="text-stone-500 text-sm">{spec.name}</span>
      <span className="text-stone-800 text-sm font-medium text-right ml-4">{value}</span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-stone-400 py-4">{text}</p>;
}
