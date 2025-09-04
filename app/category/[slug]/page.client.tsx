"use client";

import { useState } from "react";
import CategoryChips from "@/components/CategoryChips";
import FiltersPanel, { type Filters } from "@/components/FiltersPanel";
import MyListSidebar from "@/components/MyListSidebar";
import ProductsGrid from "@/components/ProductsGrid";
import { ListProvider } from "@/context/ListContext";

export default function CategoryPageClient({ slug, catName }:{ slug:string; catName:string }) {
  const [filters, setFilters] = useState<Filters>({});
  return (
    <ListProvider>
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-bold">{catName}</h1>
        <CategoryChips active={slug} />
        <div className="mt-4 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3"><FiltersPanel onChange={setFilters} /></div>
          <div className="col-span-12 lg:col-span-6 xl:col-span-6"><ProductsGrid category={slug} filters={filters} /></div>
          <div className="col-span-12 lg:col-span-3"><MyListSidebar /></div>
        </div>
      </main>
    </ListProvider>
  );
}
