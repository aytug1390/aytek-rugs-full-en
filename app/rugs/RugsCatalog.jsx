"use client";
import { useMemo, useState } from 'react';
import FilterSidebar from '../../src/components/FilterSidebar';

// Mock dataset (replace with API fetch later)
const MOCK_RUGS = [
  { id: 'R001', title: 'Antique Heriz', origin: 'Persia', size: 'Large (8x10+)', design: 'Medallion', color: 'Red', collection: 'Antique', age: 'Antique (50-100y)', material: 'Wool', price: 8500, stock: 'Available' },
  { id: 'R002', title: 'Tribal Yastik', origin: 'Turkey', size: 'Small (up to 5x8)', design: 'Geometric', color: 'Red', collection: 'Anatolian', age: 'Vintage (20-50y)', material: 'Wool', price: 780, stock: 'Available' },
  { id: 'R003', title: 'Silk Qum', origin: 'Persia', size: 'Medium (6x9)', design: 'Floral', color: 'Beige', collection: 'Silk', age: 'Vintage (20-50y)', material: 'Silk', price: 6200, stock: 'Sold' },
  { id: 'R004', title: 'Modern Abstract', origin: 'Turkey', size: 'Large (8x10+)', design: 'Minimal', color: 'Multi', collection: 'Modern', age: 'Vintage (20-50y)', material: 'Wool & Cotton', price: 2900, stock: 'Available' },
  { id: 'R005', title: 'Caucasian Kazak', origin: 'Caucasus', size: 'Medium (6x9)', design: 'Geometric', color: 'Blue', collection: 'Tribal', age: 'Antique (50-100y)', material: 'Wool', price: 5100, stock: 'Available' },
  { id: 'R006', title: 'Moroccan Beni', origin: 'Morocco', size: 'Large (8x10+)', design: 'Minimal', color: 'Beige', collection: 'Modern', age: 'Vintage (20-50y)', material: 'Wool', price: 3400, stock: 'Available' },
  { id: 'R007', title: 'Patchwork Overdyed', origin: 'Turkey', size: 'Large (8x10+)', design: 'Geometric', color: 'Green', collection: 'Patchwork', age: 'Vintage (20-50y)', material: 'Wool', price: 2100, stock: 'Sold' },
  { id: 'R008', title: 'Antique Silk Hereke', origin: 'Turkey', size: 'Small (up to 5x8)', design: 'Floral', color: 'Red', collection: 'Silk', age: 'Collector (100y+)', material: 'Silk', price: 15000, stock: 'Available' },
];

export default function RugsCatalog() {
  const [filters, setFilters] = useState(null);

  const filtered = useMemo(() => {
    if (!filters) return MOCK_RUGS;
    return MOCK_RUGS.filter(r => {
      if (filters.rugIds) {
        const ids = filters.rugIds.split(/[\n\s]+|,/).map(x => x.trim()).filter(Boolean).slice(0,25);
        if (ids.length && !ids.includes(r.id)) return false;
      }
      const matchMulti = (field) => !filters[field]?.length || filters[field].includes(r[field]);
      if (!matchMulti('size')) return false;
      if (!matchMulti('design')) return false;
      if (!matchMulti('color')) return false;
      if (!matchMulti('collection')) return false;
      if (!matchMulti('age')) return false;
      if (!matchMulti('origin')) return false;
      if (!matchMulti('material')) return false;
      if (!matchMulti('stock')) return false;
      if (filters.minPrice && r.price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && r.price > Number(filters.maxPrice)) return false;
      return true;
    });
  }, [filters]);

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
      <h1 className="text-4xl font-bold mb-2">All Rugs</h1>
      <p className="text-gray-600 mb-8 max-w-3xl">Browse a curated sample dataset below. Advanced search, real inventory sync, high‑res imagery, and inquiry workflow will be integrated next.</p>
      <div className="flex gap-8">
        <div className="hidden lg:block flex-shrink-0"><FilterSidebar onFilterChange={setFilters} /></div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-500">{filtered.length} result{filtered.length!==1 && 's'}</div>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(r => (
              <div key={r.id} className="border rounded-md p-4 bg-white shadow-sm hover:shadow transition">
                <div className="aspect-[4/3] mb-3 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 text-sm font-medium overflow-hidden">
                  {r.images && r.images.length > 0 ? (
                    <img
                      src={r.images[0].url}
                      alt={r.images[0].alt || r.title}
                      className="object-cover w-full h-full rounded"
                    />
                  ) : (
                    "IMG"
                  )}
                </div>
                <h3 className="font-semibold text-sm mb-1 line-clamp-1">{r.title}</h3>
                <div className="text-xs text-gray-500 mb-2">{r.origin} • {r.size}</div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-medium text-amber-700">${r.price.toLocaleString()}</span>
                  <span className={r.stock === 'Available' ? 'text-emerald-600' : 'text-red-500'}>{r.stock}</span>
                </div>
                <ul className="text-[10px] uppercase tracking-wide text-gray-400 flex flex-wrap gap-1">
                  <li>{r.collection}</li>
                  <li>{r.design}</li>
                  <li>{r.color}</li>
                  <li>{r.material}</li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

