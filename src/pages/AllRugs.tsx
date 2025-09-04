import CategoryGrid from "@/components/CategoryGrid";

export default function AllRugs() {
  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Shop by Category</h1>
        <p className="text-gray-600">Pick a style to explore matching rugs.</p>
      </header>

      <CategoryGrid />
    </main>
  );
}
