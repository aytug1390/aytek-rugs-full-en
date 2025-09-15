"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ListedItem = { id: string | number; name?: string; image?: string; price?: number; sku?: string };
type Ctx = {
  list: ListedItem[];
  add: (item: ListedItem) => void;
  remove: (id: string | number) => void;
  has: (id: string | number) => boolean;
  clear: () => void;
};

const ListContext = createContext<Ctx | null>(null);

export function ListProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<ListedItem[]>([]);

  useEffect(() => {
    try { const raw = localStorage.getItem("mylist"); if (raw) setList(JSON.parse(raw)); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("mylist", JSON.stringify(list)); } catch {}
  }, [list]);

  const api = useMemo<Ctx>(() => ({
    list,
    add: (item) => setList((xs) => xs.some(x => x.id === item.id) ? xs : [item, ...xs]),
    remove: (id) => setList((xs) => xs.filter(x => x.id !== id)),
    has: (id) => list.some(x => x.id === id),
    clear: () => setList([]),
  }), [list]);

  return <ListContext.Provider value={api}>{children}</ListContext.Provider>;
}
export const useList = () => {
  const ctx = useContext(ListContext);
  if (!ctx) throw new Error("useList must be used within ListProvider");
  return ctx;
};

