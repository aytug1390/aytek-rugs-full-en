"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "cookie-consent-v1";

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  function saveConsent(opts) {
    const value = {
      necessary: true,
      analytics: opts?.analytics ?? analytics,
      ads: opts?.ads ?? ads,
      ts: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "cookie_consent_updated", consent: value });
    if (window.gtag) {
      window.gtag('consent', 'update', {
        ad_storage: value.ads ? 'granted' : 'denied',
        ad_user_data: value.ads ? 'granted' : 'denied',
        ad_personalization: value.ads ? 'granted' : 'denied',
        analytics_storage: value.analytics ? 'granted' : 'denied',
      });
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-5xl m-3 rounded-2xl bg-white/95 shadow-xl border p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-gray-700">
            We use cookies to operate our site, analyze usage and, with your consent, personalize ads.
            You can change choices anytime in{" "}
            <a href="/cookie-settings" className="font-semibold text-teal-700 underline">Cookie Settings</a>.
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={analytics} onChange={e=>setAnalytics(e.target.checked)} />
              Analytics
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={ads} onChange={e=>setAds(e.target.checked)} />
              Advertising
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>saveConsent({analytics:false, ads:false})}
              className="rounded-lg border px-3 py-2 text-sm">Reject non-essential</button>
            <button onClick={()=>saveConsent({analytics:true, ads:true})}
              className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white">Accept all</button>
          </div>
        </div>
      </div>
    </div>
  );
}
