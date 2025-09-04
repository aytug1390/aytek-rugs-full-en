import React from "react";

type PageProps = {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function RugDetailPage({ params, searchParams }: PageProps) {
  const { id } = params;
  const mid = typeof searchParams?.mid === "string" ? searchParams.mid : undefined;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Rug: {id}</h1>
      {mid && <p className="text-sm opacity-70">MID: {mid}</p>}
      <p className="mt-4">
        Route çalışıyor. Bu sayfayı gerçek ürün verisiyle beslemek için
        API fetch ekleyebiliriz.
      </p>
    </div>
  );
}
