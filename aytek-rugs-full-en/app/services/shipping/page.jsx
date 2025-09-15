export default function ShippingPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">Worldwide Shipping</h1>
      <p className="text-gray-600 leading-relaxed mb-6">
        Safe and reliable international delivery for your rugs. We handle customs, insurance, and door-to-door logistics for peace of mind.
      </p>
      <div className="p-6 rounded-md bg-gray-50 border border-gray-200">
        <h3 className="font-semibold mb-2">Shipping Features</h3>
        <ul className="list-disc list-inside text-gray-900 mb-4">
          <li>Global coverage</li>
          <li>Insurance included</li>
          <li>Customs assistance</li>
        </ul>
        <p className="text-xs text-gray-800">For shipping quotes, email <strong>shipping@aytekrugs.com</strong></p>
      </div>
    </main>
  );
}


