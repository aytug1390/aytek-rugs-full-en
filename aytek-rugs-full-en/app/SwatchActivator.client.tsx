"use client";
import { useEffect } from "react";

function applySwatch(el: Element) {
  const attr = el.getAttribute?.("data-swatch");
  if (attr) {
    const elHtml = el as HTMLElement;
    const color = String(attr).trim();
    if (color) elHtml.style.setProperty('--swatch-bg', color);
  }
}

export default function SwatchActivator() {
  useEffect(() => {
    const scan = (root: ParentNode) => {
      root.querySelectorAll('[data-swatch]').forEach(applySwatch);
    };

    scan(document);

    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((n) => { if (n instanceof Element) scan(n); });
        }
        if (m.type === 'attributes' && m.target instanceof Element) {
          if ((m as any).attributeName === 'data-swatch') applySwatch(m.target as Element);
        }
      }
    });

    mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-swatch'] });

    return () => mo.disconnect();
  }, []);
  return null;
}
