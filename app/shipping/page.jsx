export const metadata = { title: "Shipping & Delivery | Aytek Rugs" };

export default function Page() {
  return (
    <article className="prose prose-teal mx-auto max-w-4xl px-4 py-10">
      <h1>Shipping & Delivery</h1>
      <ul>
        <li><strong>Regions:</strong> US domestic (NJ/NY focus).</li>
        <li><strong>Handling:</strong> In-stock items ship in 1–3 business days.</li>
        <li><strong>Transit:</strong> 2–7 business days depending on carrier/zone.</li>
        <li><strong>Fees:</strong> Shown at checkout; oversized rugs may incur extra charges.</li>
        <li><strong>Tracking:</strong> Provided upon dispatch.</li>
      </ul>

      <h2>International Shipping</h2>
      <ul>
        <li>We ship internationally on request. Duties/taxes are collected by the carrier and are the buyer’s responsibility.</li>
        <li>Transit times vary by destination and customs clearance.</li>
      </ul>

      <h2>Oversize & Freight</h2>
      <ul>
        <li>Large/oversize rugs may ship via freight carriers. A handling surcharge may apply.</li>
        <li>Delivery is curbside unless white-glove service is arranged.</li>
      </ul>
    </article>
  );
}

