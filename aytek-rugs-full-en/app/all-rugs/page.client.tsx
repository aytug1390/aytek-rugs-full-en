"use client";

import { useState, useRef, useEffect } from "react";
import CategoryChips from "@/components/CategoryChips";
import FiltersPanel, { type Filters } from "@/components/FiltersPanel";
import MyListSidebar from "@/components/MyListSidebar";
import ProductsGrid from "@/components/ProductsGrid";
import { ListProvider } from "@/context/ListContext";

export default function AllRugsClient() {
  const [filters, setFilters] = useState<Filters>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    if (drawerOpen) {
      document.addEventListener('keydown', onKey);
      // capture last active element so we can restore focus
      lastActiveRef.current = document.activeElement as HTMLElement | null;
      // focus the drawer
      setTimeout(() => drawerRef.current?.focus(), 0);
    } else {
      document.removeEventListener('keydown', onKey);
      // restore focus
      setTimeout(() => lastActiveRef.current?.focus?.(), 0);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);
  return (
    <ListProvider>
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-bold">All Rugs</h1>
        <CategoryChips />
        {/* Mobile filter button */}
        <div className="mt-3 md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium"
          >
            Filters
          </button>
        </div>
        <div className="mt-4 grid grid-cols-12 gap-6">
          {/* Main products in center */}
          <div className="col-span-12 lg:col-span-6 xl:col-span-6 order-1 lg:order-1"><ProductsGrid filters={filters} /></div>
          {/* Sidebar: user list remains on the left on large screens */}
          <div className="col-span-12 lg:col-span-3 order-3 lg:order-2"><MyListSidebar /></div>
          {/* Filters moved to right column on large screens; sticky on lg */}
          <div className="col-span-12 lg:col-span-3 order-2 lg:order-3 lg:sticky lg:top-24">
            <FiltersPanel onChange={setFilters} />
          </div>
        </div>

        {/* Mobile drawer for filters */}
        {drawerOpen && (
          <div className="fixed inset-0 z-70 flex" role="dialog" aria-modal="true" aria-label="Filters">
            <div className="fixed inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
            <div ref={drawerRef} tabIndex={-1} className="ml-auto w-11/12 max-w-sm bg-white h-full p-4 overflow-auto shadow-lg" aria-hidden={!drawerOpen}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Filters</h3>
                <button className="text-sm text-gray-600" onClick={() => setDrawerOpen(false)}>Close</button>
              </div>
              <FiltersPanel onChange={(f) => { setFilters(f); setDrawerOpen(false); }} />
            </div>
          </div>
        )}
      </main>
    </ListProvider>
  );
}

