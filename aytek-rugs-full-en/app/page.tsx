import CategoryStrip from "@/components/CategoryStrip";
// Use relative import to avoid relying on tsconfig/jsconfig alias during build
import Hero from "./components/Hero";
// Use relative import to avoid relying on tsconfig/jsconfig alias during build
import ProductsGrid from "../src/components/product/ProductsGrid";
import Features from "./components/Features";
import HappyCustomers from "./components/HappyCustomers";
import Reviews from "./components/Reviews";

export default function HomePage() {
  const sampleProducts = [
    {
      id: 1,
      title: "Kayseri Rug",
      price: 1200,
      img: { src: "/images/bg/hero1.png", width: 1600, height: 900 },
    },
    {
      id: 2,
      title: "Cappadocia Rug",
      price: 950,
      img: { src: "/images/bg/hero2.png", width: 1600, height: 900 },
    },
  ];

  return (
    <main>
  <Hero title="Discover Timeless Handmade Rugs" subtitle="4 generations of craftsmanship" background={{ src: "/images/bg/hero1.png", width: 1600, height: 900 }} cta={{ label: "Shop Now", href: "/all-rugs" }} />
      <Features />
      {/* Show Rooms (replaces Shop by Category and Featured Rugs) */}
      <section className="container mx-auto px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Show Rooms</h2>
            <p className="text-sm text-neutral-600">Explore our collections and visit the full showroom.</p>
          </div>
          <a href="/all-rugs" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
            <span>All Rugs</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </a>
        </header>

        <div className="mb-8">
          <CategoryStrip />
        </div>

        {/* Optional: keep featured grid removed; showroom links should guide users to /all-rugs for product listings */}
      </section>

      <HappyCustomers />
      <Reviews />
    </main>
  );
}

