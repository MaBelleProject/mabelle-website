"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface Ctx { open: boolean; toggle: () => void; close: () => void; }

const MenuContext = createContext<Ctx>({ open: false, toggle: () => {}, close: () => {} });

export function MenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <MenuContext.Provider value={{
      open,
      toggle: () => setOpen(v => !v),
      close: () => setOpen(false),
    }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() { return useContext(MenuContext); }
