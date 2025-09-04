import CategoryStrip from "@/components/CategoryStrip";

export default function Home() {
  return (
    <main>
      <section className="container mx-auto px-4 py-8">
        <header className="mb-3 flex items-end justify-between">
          <h2 className="text-xl md:text-2xl font-bold">Shop by Category</h2>
          <a href="/all-rugs" className="text-sm text-blue-600 hover:underline">View all</a>
        </header>
        <CategoryStrip />
      </section>
    </main>
  );
}
