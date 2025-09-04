"use client";
import { useEffect, useState } from "react";
import Script from "next/script";

const KEY = "cookie-consent-v1";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const GADS_ID = process.env.NEXT_PUBLIC_GADS_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function ConsentScripts() {
  const [consent, setConsent] = useState(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      setConsent(saved || { necessary: true, analytics: false, ads: false });
    } catch {
      setConsent({ necessary: true, analytics: false, ads: false });
    }
  }, []);

  if (!consent) return null;

  const adGranted   = consent.ads ? "granted" : "denied";
  const anaGranted  = consent.analytics ? "granted" : "denied";

  return (
    <>
      {/* Consent Mode default+update */}
      <Script id="consent-mode" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            ad_storage: '${adGranted}',
            ad_user_data: '${adGranted}',
            ad_personalization: '${adGranted}',
            analytics_storage: '${anaGranted}'
          });
        `}
      </Script>

      {/* GA4 (Analytics) */}
      {consent.analytics && GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}
          </Script>
        </>
      )}

      {/* Google Ads (Conversions) */}
      {consent.ads && GADS_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GADS_ID}`} strategy="afterInteractive" />
          <Script id="gads-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('config', '${GADS_ID}');
            `}
          </Script>
        </>
      )}

      {/* Meta Pixel */}
      {consent.ads && META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src='https://connect.facebook.net/en_US/fbevents.js';
            s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
