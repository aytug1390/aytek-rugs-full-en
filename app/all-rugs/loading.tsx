export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="h-6 w-40 bg-gray-200 animate-pulse rounded mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-100 animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}
