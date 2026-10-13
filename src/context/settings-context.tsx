"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Show "Only X left" on products (dashboard setting), loaded once by the root layout. */
const ShowStockLeftContext = createContext(false);

export function ShowStockLeftProvider({ value, children }: { value: boolean; children: ReactNode }) {
  return <ShowStockLeftContext.Provider value={value}>{children}</ShowStockLeftContext.Provider>;
}

export function useShowStockLeft() { return useContext(ShowStockLeftContext); }
