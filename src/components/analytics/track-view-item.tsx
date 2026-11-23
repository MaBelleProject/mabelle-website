"use client";

import { trackViewItem, type GaItem } from "@/lib/analytics";
import { useEffect } from "react";

// React's development double-mount would otherwise report the same view twice.
let last = { id: "", at: 0 };

/** Reports view_item once per product / bundle / gift page view. Renders nothing. */
export default function TrackViewItem({ item }: { item: Omit<GaItem, "quantity"> }) {
  const { item_id } = item;
  useEffect(() => {
    const now = Date.now();
    if (last.id === item_id && now - last.at < 1000) return;
    last = { id: item_id, at: now };
    trackViewItem(item);
  }, [item_id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
