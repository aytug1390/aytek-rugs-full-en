import { CATEGORIES } from "@/data/categories";
import CategoryPageClient from "./page.client";

export function generateStaticParams() {
  return CATEGORIES.map(c => ({ slug: c.slug }));
}

export default function Page({ params }:{ params:{ slug:string } }) {
  const cat = CATEGORIES.find(c => c.slug === params.slug);
  return <CategoryPageClient slug={params.slug} catName={cat?.name ?? "Rugs"} />;
}
