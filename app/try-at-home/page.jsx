
import TradeForm from "../components/TradeForm";
export const metadata = { title: 'Try At Home Rug Preview | Aytek Rugs' };

export default function TryAtHomePage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">Try At Home Program</h1>
      <p className="text-gray-600 leading-relaxed mb-6 max-w-2xl">
        Evaluate select rugs in your space before committing. Our Try At Home service reduces
        uncertainty around scale, light, texture and color harmony—especially for investment pieces.
      </p>
      <section className="grid md:grid-cols-2 gap-10 mb-12">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Included Services</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Up to 3 rugs per shipment (higher by approval)</li>
            <li>48‑hour in‑home evaluation window</li>
            <li>Protective wrapping & handling guidance</li>
            <li>Optional digital mockups before shipment</li>
            <li>White‑glove placement (select metro areas)</li>
          </ul>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Eligibility</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Approved account or designer partner</li>
            <li>Retail value per rug ≥ $2,000</li>
            <li>Security deposit or card authorization</li>
            <li>Clean, pet‑safe evaluation area</li>
            <li>Return shipment readiness within window</li>
          </ul>
        </div>
      </section>
      <div className="rounded-md bg-emerald-50 border border-emerald-200 p-6 max-w-3xl mb-8">
        <h3 className="font-semibold mb-2">Request a Try At Home Session</h3>
        <p className="text-sm text-emerald-900 mb-4">A scheduling form will appear here soon. For early access, email <strong>try@aytekrugs.com</strong> with desired styles, approximate sizes, and project timeline.</p>
        <p className="text-xs text-emerald-800">We can also generate proportion mockups if you send a quick room photo & dimensions.</p>
      </div>
      {/* TradeForm: Aynı formu burada da göster */}
      <div className="max-w-3xl mx-auto">
        <h3 className="font-semibold mb-4 text-gray-900">Quick Trade-In / Preview Request</h3>
        <p className="text-sm text-gray-700 mb-2">Hızlıca fotoğraf ve detay göndererek hem trade-in hem de ön izleme talebinizi iletebilirsiniz.</p>
        <TradeForm />
      </div>
    </main>
  );
}

