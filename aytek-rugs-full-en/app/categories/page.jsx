import Link from "next/link";
import ImageSafe from '../components/ImageSafe';

async function getCategories() {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:5000';
  try {
    const r = await fetch(`${base}/admin-api/categories`, { cache: 'no-store' });
    if (!r.ok) return [];
    const { items } = await r.json();
    return items;
  } catch (e) {
    return [];
  }
}

function CategoryCard({ c }) {
  return (
    <Link
      href={`/all-rugs?category=${encodeURIComponent(c.slug)}&limit=50`}
      className="group block rounded-2xl overflow-hidden border hover:shadow-md transition"
    >
      <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
        <MagnifyImage
          src={c.image}
          alt={c.name}
          zoom={2.0}
          lensSize={140}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold">{c.name}</h3>
        {c.description ? (
          <p className="text-sm text-gray-600 line-clamp-2 mt-1">{c.description}</p>
        ) : null}
        <span className="inline-block mt-3 text-sm font-medium text-blue-600 group-hover:underline">
          View rugs →
        </span>
      </div>
    </Link>
  );
}

export default async function CategoriesPage() {
  const cats = await getCategories();
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Collections</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cats.map(c => <CategoryCard key={c.slug} c={c} />)}
      </div>
    </main>
  );
}

