"use client";

import React, { useEffect } from "react";
import { ListProvider } from "@/context/ListContext";
import ProductsGridClient from "./ProductsGrid.client";

export default function ClientGridWrapper(props: any) {
  // Remove the server-rendered grid when the client mounts to avoid
  // duplicate product cards (server markup + client-rendered grid).
  useEffect(() => {
    try {
      const node = document.getElementById('__all_rugs_server_grid__');
      if (node && node.parentNode) node.parentNode.removeChild(node);
    } catch (e) {
      // ignore in edge cases
    }
  }, []);
  return (
    <ListProvider>
      <ProductsGridClient {...props} />
    </ListProvider>
  );
}
