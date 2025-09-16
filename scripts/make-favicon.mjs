import sharp from "sharp";
import pngToIco from "png-to-ico";
import { mkdirSync, writeFileSync } from "node:fs";

const src = "public/images/aytek-logo.png";   // kaynak logo
const sizes = [16, 32, 48, 64];

mkdirSync("public/icons", { recursive: true });

// Boyutlu PNG'leri üret
await Promise.all(
  sizes.map(sz =>
    sharp(src)
      .resize(sz, sz, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(`public/icons/${sz}.png`)
  )
);

// ICO üret (çoklu boy)
const buf = await pngToIco(sizes.map(sz => `public/icons/${sz}.png`));
writeFileSync("public/favicon.ico", buf);
console.log("✅ Çok boyutlu favicon üretildi: public/favicon.ico");
