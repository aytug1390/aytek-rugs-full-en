"use client";
import { useEffect } from "react";
// Use the local driveImage extractor from the app project (paths: @ -> src)
import { extractDriveId } from "@/lib/driveImage";

const driveProxy = (id: string, sz = 1200) => `/api/drive?id=${encodeURIComponent(id)}&sz=${sz}`;

const rewriteUrl = (u: string, sz = 1200) => {
  const id = extractDriveId(u);
  return id ? driveProxy(id, sz) : u;
};

const rewriteSrcset = (val: string) =>
  val
    .split(",")
    .map((part) => {
      const [url, desc] = part.trim().split(/\s+/, 2);
      return [rewriteUrl(url), desc].filter(Boolean).join(" ");
    })
    .join(", ");

const rewriteStyleBg = (val: string) =>
  val.replace(/url\((['"]?)([^)'"]+)\1\)/gi, (_m, q, url) => `url(${q}${rewriteUrl(url)}${q})`);

function touch(el: Element) {
  if (el instanceof HTMLImageElement) {
    if (/googleusercontent|drive\.google/.test(el.src)) el.src = rewriteUrl(el.src);
    if (el.srcset && /googleusercontent|drive\.google/.test(el.srcset)) el.srcset = rewriteSrcset(el.srcset);
    return;
  }
  if (el instanceof HTMLLinkElement) {
    if (/(preload|prefetch)/i.test(el.rel) && el.as === "image" && /googleusercontent|drive\.google/.test(el.href)) {
      el.href = rewriteUrl(el.href, 1600);
    }
    return;
  }
  if (el instanceof HTMLSourceElement && el.srcset && /googleusercontent|drive\.google/.test(el.srcset)) {
    el.srcset = rewriteSrcset(el.srcset);
    return;
  }
  const style = (el as HTMLElement).getAttribute?.("style");
  if (style && /googleusercontent|drive\.google/.test(style)) {
    (el as HTMLElement).setAttribute("style", rewriteStyleBg(style));
  }
}

export default function ClientRewriter() {
  useEffect(() => {
    const scan = (root: ParentNode) =>
      root
        .querySelectorAll("img,link[rel=preload][as=image],link[rel=prefetch][as=image],source,[style]")
        .forEach(touch);

    scan(document);

    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes.forEach((n) => {
          if (n instanceof Element) {
            touch(n);
            scan(n);
          }
        });
        if (m.type === "attributes" && m.target instanceof Element) touch(m.target);
      }
    });
    mo.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["src", "srcset", "href", "style", "rel", "as"],
    });
    return () => mo.disconnect();
  }, []);
  return null;
}
