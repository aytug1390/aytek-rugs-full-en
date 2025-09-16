"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold mb-2">Beklenmeyen bir hata oluştu</h2>
      <p className="text-sm text-gray-600 mb-4">{error?.message}</p>
      <button className="px-3 py-2 rounded border" onClick={() => reset()}>
        Tekrar dene
      </button>
    </div>
  );
}
