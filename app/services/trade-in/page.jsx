export const metadata = { title: 'Rug Trade-In & Guaranteed Pricing | Aytek Rugs' };

export default function TradeInPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">Rug Trade-In & Guaranteed Pricing</h1>
      <p className="text-gray-600 leading-relaxed mb-6 max-w-2xl">
        Upgrade or rebalance your collection with our fair, transparent trade‑in program. We assess
        condition, provenance, age, rarity, material quality and current market demand to deliver a
        guaranteed offer—no auctions, no uncertainty.
      </p>
      <section className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">How It Works</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Submit photos & basic details (size, origin, condition, issues).</li>
            <li>Receive a preliminary valuation range within 24–48 hours.</li>
            <li>Send or bring the rug for physical inspection (optional pickup in NY/NJ metro).</li>
            <li>Get a firm guaranteed offer or elevated consignment option.</li>
            <li>Apply full value toward a new acquisition or receive direct payment.</li>
          </ol>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">What We Consider</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Authenticity & weaving region</li>
            <li>Natural vs synthetic dyes</li>
            <li>Wool / silk quality & knot density</li>
            <li>Repairs, losses, stains, sun fade</li>
            <li>Design uniqueness & collector demand</li>
          </ul>
        </div>
      </section>
      <div className="p-6 rounded-md bg-amber-50 border border-amber-200 max-w-3xl">
        <h3 className="font-semibold mb-2">Start a Trade-In</h3>
        <p className="text-sm text-amber-900 mb-4">A submission form will appear here soon. For now email detailed photos (front, back, close-ups of edges & any damage) to <strong>trade@aytekrugs.com</strong>.</p>
        <p className="text-xs text-amber-800">We respond to most valuation requests within 1 business day.</p>
      </div>
    </main>
  );
}

