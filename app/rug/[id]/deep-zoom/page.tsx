export const dynamic = 'force-dynamic';

import DeepZoomClient from './DeepZoom.client';

export default async function DeepZoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Deep Zoom — {id}</h1>
      <DeepZoomClient id={id} />
    </main>
  );
}
