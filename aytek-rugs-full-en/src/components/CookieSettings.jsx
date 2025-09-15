"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "cookie-consent-v1";

export default function CookieSettings() {
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved) {
        setAnalytics(!!saved.analytics);
        setAds(!!saved.ads);
      }
    } catch {}
    setLoaded(true);
  }, []);

  function save() {
    const value = { necessary: true, analytics, ads, ts: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "cookie_consent_updated", consent: value });
    alert("Preferences saved.");
  }

  if (!loaded) return null;

  return (
    <form className="space-y-4">
      <div className="rounded-2xl border p-4">
        <h3 className="font-semibold">Strictly Necessary</h3>
        <p className="text-sm text-gray-600">Required for the site to function. Always on.</p>
      </div>
      <div className="rounded-2xl border p-4">
        <label className="flex items-center gap-3" htmlFor="cookie-analytics">
          <input id="cookie-analytics" name="analytics" type="checkbox" checked={analytics} onChange={e=>setAnalytics(e.target.checked)} />
          <div>
            <div className="font-semibold">Analytics</div>
            <p className="text-sm text-gray-600">Helps us improve the site (e.g., GA4).</p>
          </div>
        </label>
      </div>
      <div className="rounded-2xl border p-4">
        <label className="flex items-center gap-3" htmlFor="cookie-ads">
          <input id="cookie-ads" name="ads" type="checkbox" checked={ads} onChange={e=>setAds(e.target.checked)} />
          <div>
            <div className="font-semibold">Advertising</div>
            <p className="text-sm text-gray-600">Personalized ads measurement.</p>
          </div>
        </label>
      </div>
      <button type="button" onClick={save}
        className="rounded-lg bg-teal-600 px-4 py-2 text-white font-semibold">Save preferences</button>
    </form>
  );
}

