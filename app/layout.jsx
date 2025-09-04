
import "../styles/globals.css";
import Navbar from "../src/components/Navbar";
import Footer from "../src/components/Footer";
import CookieBanner from "../src/components/CookieBanner";
import ConsentScripts from "../src/components/ConsentScripts";
import Providers from "./providers";

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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
  <body className="min-h-screen flex flex-col bg-gray-50">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieBanner />
          <ConsentScripts />
        </Providers>
      </body>
    </html>
  );
}

