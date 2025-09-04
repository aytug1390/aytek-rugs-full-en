
import TradeForm from "../components/TradeForm";

export default function TradeInPage() {
  return (
    <div className="bg-gray-50 py-16 px-6 lg:px-20">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          Rug Trade-In & Guaranteed Pricing
        </h1>
        <p className="text-lg text-gray-700 leading-relaxed">
          Upgrade or rebalance your collection with Aytek Rugs’ transparent
          Trade-In Program. We evaluate your rug’s{" "}
          <span className="font-semibold">
            authenticity, craftsmanship, and market demand
          </span>{" "}
          to deliver a guaranteed, fair offer — no auctions, no uncertainty.
        </p>
      </div>

      {/* Process Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto mb-16">
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            How It Works
          </h2>
          <ol className="list-decimal list-inside text-gray-700 space-y-3">
            <li>Submit photos & details (size, origin, age, condition).</li>
            <li>
              Receive a preliminary valuation range within{" "}
              <strong>24–48 hours</strong>.
            </li>
            <li>
              Optional: Schedule rug pickup in the NY/NJ metro area, or ship
              securely.
            </li>
            <li>Get a firm guaranteed offer or explore consignment options.</li>
            <li>
              Apply full value toward a new acquisition or request direct
              payment.
            </li>
          </ol>
        </div>

        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            What We Consider
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Authenticity & weaving region</li>
            <li>Natural vs synthetic dyes</li>
            <li>Wool / silk quality & knot density</li>
            <li>Repairs, stains, sun fading, or damage</li>
            <li>Uniqueness of design & collector demand</li>
          </ul>
        </div>
      </div>

      {/* Trade-In Form */}
      <div className="max-w-3xl mx-auto mb-8">
        <TradeForm />
      </div>
    </div>
  );
}

