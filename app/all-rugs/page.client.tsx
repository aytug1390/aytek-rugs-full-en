"use client";

import ProductsGridClient from "./ProductsGrid.client";

export default function AllRugsClient() {
  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-bold">All Rugs</h1>
      <ProductsGridClient limit={24} page={1} />
    </main>
  );
}

