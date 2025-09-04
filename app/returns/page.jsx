import Script from "next/script";

export const metadata = { title: "Returns & Refunds | Aytek Rugs" };

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MerchantReturnPolicy",
    "name": "Aytek Rugs Return Policy",
    "applicableCountry": "US",
    "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
    "merchantReturnDays": 30,
    "returnMethod": "https://schema.org/ReturnByMail",
    "returnFees": "https://schema.org/OriginalShippingFees",
    "refundType": "https://schema.org/FullRefund",
    "itemCondition": "https://schema.org/NewCondition",
    "applicableProductReturnPolicy": [],
    "returnPolicySeasonalOverride": [],
  };

  return (
    <article className="prose prose-teal mx-auto max-w-4xl px-4 py-10">
      <Script id="merchant-return-policy" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1>Returns & Refunds</h1>
      <p><strong>Return window:</strong> 30 days from delivery (unused, resellable condition).</p>
      <h2>How to return</h2>
      <ol>
        <li>Contact us at <a href="mailto:aytek.usa.inc@gmail.com">aytek.usa.inc@gmail.com</a> with order details.</li>
        <li>We issue an RMA and instructions. Returns by mail unless otherwise arranged.</li>
        <li>Refunds issued after inspection (5–10 business days).</li>
      </ol>
      <h2>Damaged or incorrect items</h2>
      <p>Please report within 48 hours of delivery. Shipping damage requires a carrier note/photo.</p>
      <h2>Services (cleaning, repair)</h2>
      <p>Custom services are not returnable; we offer fix or partial refund if workmanship is not as agreed.</p>

      <h2>International Returns</h2>
      <p>
        International customers are welcome; however, return shipping and any duties/taxes are the buyer’s responsibility
        unless the item arrived damaged or incorrect. Please contact us before shipping your return.
      </p>

      <h2>Oversize Rugs & Freight</h2>
      <p>
        Oversized or freight-only items may require special packaging and carriers. In such cases, return shipping is not
        prepaid unless explicitly stated. We can help arrange discounted freight labels upon request.
      </p>
    </article>
  );
}

