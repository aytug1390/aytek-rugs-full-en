export default function CertificationPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">Certified Rug Identification</h1>
      <p className="text-gray-600 leading-relaxed mb-6">
        Unique ID & authenticity certificate for every handmade rug. Our experts verify origin, age, and craftsmanship, providing official documentation for collectors and owners.
      </p>
      <div className="p-6 rounded-md bg-purple-50 border border-purple-200">
        <h3 className="font-semibold mb-2">How to Get Certified</h3>
        <ul className="list-disc list-inside text-purple-900 mb-4">
          <li>Submit rug details and photos</li>
          <li>Expert review and verification</li>
          <li>Receive certificate and digital record</li>
        </ul>
        <p className="text-xs text-purple-800">For more info, email <strong>certify@aytekrugs.com</strong></p>
      </div>
    </main>
  );
}

