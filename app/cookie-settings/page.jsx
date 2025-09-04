"use client";
import CookieSettings from "../../src/components/CookieSettings";

export default function Page() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">Cookie Settings</h1>
      <CookieSettings />
    </section>
  );
}

