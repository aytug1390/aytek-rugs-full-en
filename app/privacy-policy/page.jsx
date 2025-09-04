export const metadata = { title: "Privacy Policy | Aytek Rugs" };

export default function Page() {
  return (
    <article className="prose prose-teal mx-auto max-w-4xl px-4 py-10">
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
      <h2>Scope</h2>
      <p>This policy explains how AYTEK USA Inc. (“we”) collects, uses and shares personal data via aytekrugs.com and our services (repairs, cleaning, restoration).</p>
      <h2>Data We Collect</h2>
      <ul>
        <li>Contact details (name, email, phone), quote/order info, delivery address</li>
        <li>Payment status (processed by our payment provider), device/analytics data (cookies)</li>
      </ul>
      <h2>Purposes</h2>
      <ul>
        <li>Fulfilling services and orders, billing, customer support</li>
        <li>Fraud prevention, site improvement, marketing (with appropriate consent)</li>
      </ul>
      <h2>Third Parties</h2>
      <p>Payment (e.g., Stripe), hosting/CDN (e.g., Vercel/Cloudinary), analytics (GA4), messaging providers.</p>
      <h2>Cookies</h2>
      <p>See our <a href="/cookie-policy">Cookie Policy</a> and manage preferences at <a href="/cookie-settings">Cookie Settings</a>.</p>
      <h2>Retention</h2>
      <p>We keep data only as long as necessary for legal and business purposes (e.g., tax records).</p>
      <h2>Your Rights</h2>
      <p>Access, rectification, deletion, objection, portability. Contact: <a href="mailto:aytek.usa.inc@gmail.com">aytek.usa.inc@gmail.com</a>.</p>
      <h2>Children</h2>
      <p>Services are not directed to children under 13.</p>
      <h2>Contact</h2>
      <p>AYTEK USA Inc., 711 Route 17 North, Carlstadt, NJ 07072 • (201) 554-7202</p>
    </article>
  );
}

