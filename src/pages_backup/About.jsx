import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-gray-900 text-white">
        <img
          src="/images/about/hero.webp"
          alt="Aytek Rugs — Handmade Rugs"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          loading="eager"
          width="1920"
          height="1080"
        />
        <div className="relative p-10 md:p-16">
          <h1 className="text-3xl md:text-5xl font-extrabold">
            Aytek Rugs — Four Generations, One Craft
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-3xl">
            From Ürgüp (1988) to Istanbul (1994) and New Jersey (since 2011): sales, professional cleaning,
            repair & restoration, custom weaving, and curated sourcing—everything a rug may need.
          </p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur px-4 py-3">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-base md:text-lg">
              <b>Free Visual Mockup:</b> Send your room photo—get a <b>free</b> mockup with your selected rug.
            </p>
          </div>
          <Link
            to="/designers"
            className="mt-8 inline-block rounded-xl bg-white text-gray-900 px-5 py-3 font-semibold"
          >
            Designers Program
          </Link>
        </div>
      </section>
      {/* TIMELINE */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Our Story</h2>
        <ol className="relative border-l border-gray-200">
          {[
            { year: "1988", text: "Founded in Ürgüp." },
            { year: "1994", text: "Expanded operations in Istanbul." },
            { year: "2011", text: "Rooted in the USA — New Jersey." },
            { year: "Today", text: "Strong presence in the U.S.; past collaborations in Canada & Australia." },
          ].map((i, idx) => (
            <li key={idx} className="mb-8 ml-6">
              <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 ring-8 ring-white">
                <span className="h-2 w-2 rounded-full bg-gray-600" />
              </span>
              <h3 className="font-semibold">{i.year}</h3>
              <p className="text-gray-600">{i.text}</p>
            </li>
          ))}
        </ol>
      </section>
      {/* WHY US */}
      <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            t: "Certified Inventory",
            d: "Every rug carries a unique ID and certificate.",
          },
          {
            t: "Cultural Expertise",
            d: "Deep knowledge of Middle Eastern motifs and natural dyes.",
          },
          {
            t: "Client-First Service",
            d: "Friendly, transparent, and quality-graded approach.",
          },
          {
            t: "Designers Program",
            d: "Trade discounts, custom sourcing, and priority access.",
          },
        ].map((c, i) => (
          <div key={i} className="rounded-2xl border p-6 bg-white">
            <h3 className="font-semibold text-lg">{c.t}</h3>
            <p className="mt-2 text-gray-600">{c.d}</p>
          </div>
        ))}
      </section>
      {/* POLICIES */}
      <section className="mt-12 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border p-6 bg-white">
          <h3 className="font-semibold text-lg">Lifetime Exchange Promise</h3>
          <p className="mt-2 text-gray-600">
            For flawless, certified Aytek Rugs pieces (after expert inspection),
            you receive at least the original purchase value as exchange credit.
            When applicable, appreciation may be reflected.
          </p>
        </div>
        <div className="rounded-2xl border p-6 bg-white">
          <h3 className="font-semibold text-lg">Logistics & Placement</h3>
          <p className="mt-2 text-gray-600">
            Free shipping to the USA & Canada. Optional in-home placement at no cost,
            scheduled within up to 30 days. Orders go to FedEx the next business day;
            tracking is shared the same day.
          </p>
        </div>
        <div className="rounded-2xl border p-6 bg-white">
          <h3 className="font-semibold text-lg">Cleaning & Repair</h3>
          <p className="mt-2 text-gray-600">
            Professional cleaning typically takes 14 business days.
            Repair & restoration timelines depend on the scope of work.
          </p>
        </div>
      </section>
      {/* RETURNS */}
      <section className="mt-6 rounded-2xl border p-6 bg-white">
        <h3 className="font-semibold text-lg">30-Day Returns</h3>
        <p className="mt-2 text-gray-600">
          No-questions-asked returns within 30 days on undamaged items. We aim for long-term trust and care.
        </p>
      </section>
      {/* CTA */}
      <section className="mt-10 flex flex-col md:flex-row gap-4">
        <Link
          to="/designers"
          className="flex-1 text-center rounded-xl border px-5 py-3 font-semibold hover:bg-gray-50"
        >
          Join the Designers Program
        </Link>
        <Link
          to="/services#cleaning-form"
          className="flex-1 text-center rounded-xl bg-black text-white px-5 py-3 font-semibold hover:opacity-90"
        >
          Get a Cleaning / Repair Quote
        </Link>
      </section>
    </main>
  );
}
