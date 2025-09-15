
import "../styles/globals.css";
import Navbar from "../src/components/Navbar";
import Footer from "../src/components/Footer";
import CookieBanner from "../src/components/CookieBanner";
import ConsentScripts from "../src/components/ConsentScripts";
import Providers from "./providers";
import ClientRewriter from "./ClientRewriter";
import SwatchActivator from "./SwatchActivator.client";

export const metadata = {
  metadataBase: new URL("https://www.aytekrugs.com"),
  title: { default: "Aytek Rugs", template: "%s | Aytek Rugs" },
  description: "Rug repair, cleaning and restoration.",
  alternates: { canonical: "/" },
  openGraph: {
    siteName: "Aytek Rugs",
    type: "website",
    url: "https://www.aytekrugs.com",
  },
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  // use getDriveImageSrc so preloads point to same-origin proxy when possible
  const { getDriveImageSrc } = require('../src/lib/drive');
  const preloadHref = getDriveImageSrc('1q_ta8OKx9f5DAWJQ9a45X8mjgL3ZSC4E', 1600);

  return (
    <html lang="en">
    <head>
      <link rel="preload" as="image" href={preloadHref} fetchPriority="high" referrerPolicy="no-referrer" />
      {/* Optional: commented out script preload that caused a webhint warning */}
      {/* <link rel="preload" as="script" href="/_next/static/chunks/webpack.js" fetchPriority="low" /> */}
    </head>
    <body className="min-h-screen flex flex-col bg-gray-50">
      <Providers>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieBanner />
        <ConsentScripts />
      </Providers>
  {/* Client-side rewriter to convert any remaining Drive URLs to same-origin proxy */}
  <ClientRewriter />
  {/* Small helper to set --swatch-bg from data-swatch attributes so we avoid inline styles */}
  <SwatchActivator />
    </body>
    </html>
  );
}

