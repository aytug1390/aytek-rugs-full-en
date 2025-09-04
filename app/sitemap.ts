import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.aytekrugs.com";
  const paths = [
    "", "privacy-policy","terms","returns","shipping",
    "cookie-policy","cookie-settings","do-not-sell",
    "accessibility","warranty-repairs","contact",
    "rugs","trade","try","services","references","designers","about",
  ];
  return paths.map(p => ({
    url: `${base}/${p}`.replace(/\/$/, ""),
    changeFrequency: "monthly",
    priority: p ? 0.6 : 0.8,
  }));
}
