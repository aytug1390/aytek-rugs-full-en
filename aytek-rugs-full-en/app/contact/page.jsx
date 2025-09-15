export const metadata = {
  title: "Contact | Aytek Rugs",
  description: "Get in touch for repairs, cleaning and restoration quotes.",
};

export default function Page() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
      <p className="mt-2 text-gray-600">
        Questions or a quick quote? Call, text or email us — we reply the same day.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border p-5">
          <h2 className="text-lg font-semibold">Phone</h2>
          <a className="mt-1 block text-teal-700 font-medium" href="tel:2015547202">
            (201) 554-7202
          </a>
          <h2 className="mt-4 text-lg font-semibold">Email</h2>
          <a className="mt-1 block text-teal-700 font-medium" href="mailto:aytek.usa.inc@gmail.com">
            aytek.usa.inc@gmail.com
          </a>
          <h2 className="mt-4 text-lg font-semibold">Address</h2>
          <p className="mt-1 text-gray-700">
            711 Route 17 North, Carlstadt, NJ 07072
          </p>
        </div>

        <div className="rounded-2xl border p-5">
          <h2 className="text-lg font-semibold">Get a Free Quote</h2>
          <p className="mt-1 text-gray-600">Upload 1–3 photos — 2 minutes.</p>
          {/* QuoteCTA bir client component ise direkt import edip kullanabiliriz */}
          {/* import QuoteCTA from "@/components/QuoteCTA"; */}
          {/* <div className="mt-4"><QuoteCTA /></div> */}
          <div className="flex flex-col gap-4 mt-4">
            <a
              href="/trade-in"
              className="inline-flex items-center gap-2 rounded-full bg-yellow-600 px-5 py-3 font-semibold text-black"
            >
              ♻️ Trade-In
            </a>
            <a
              href="/services/rug-cleaning"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 font-semibold text-white"
            >
              🧽 Rug Cleaning
            </a>
            <a
              href="#quote"
              className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-5 py-3 font-semibold text-white"
            >
              🧵 Free Rug Repair Quote
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

