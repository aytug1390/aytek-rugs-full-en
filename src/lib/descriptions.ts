type Product = {
  origin?: string;
  material?: string;
  size_cm?: string;     // "170x240"
  size_in?: string;     // "67x95"
  pattern?: string;
  age?: string;         // "Vintage", "Circa 1970s", "New"...
  description?: string;
};

const clean = (v?: string) => (v || "").trim();

export function buildDescriptionEN(p: Product) {
  const origin = clean(p.origin);
  const material = clean(p.material);
  const sizeCm = clean(p.size_cm);
  const sizeIn = clean(p.size_in);
  const pattern = clean(p.pattern);
  const age = clean(p.age);

  const parts: string[] = [];
  if (origin || material) parts.push(`Hand-woven ${origin ? origin + " " : ""}rug${material ? `, ${material}` : ""}.`);
  if (sizeCm || sizeIn)   parts.push(`Size: ${[sizeCm && `${sizeCm} cm`, sizeIn && `${sizeIn} in`].filter(Boolean).join(" / ")}.`);
  if (pattern)            parts.push(`Pattern: ${pattern}.`);
  if (age)                parts.push(`Approx. age: ${age}.`);
  parts.push(`Professionally cleaned and ready to use.`);

  return parts.join(" ");
}

export function buildDescriptionTR(p: Product) {
  const origin = clean(p.origin);
  const material = clean(p.material);
  const sizeCm = clean(p.size_cm);
  const sizeIn = clean(p.size_in);
  const pattern = clean(p.pattern);
  const age = clean(p.age);

  const parts: string[] = [];
  if (origin || material) parts.push(`El dokuması ${origin ? origin + " " : ""}halı${material ? `, ${material}` : ""}.`);
  if (sizeCm || sizeIn)   parts.push(`Ölçü: ${[sizeCm && `${sizeCm} cm`, sizeIn && `${sizeIn} inç`].filter(Boolean).join(" / ")}.`);
  if (pattern)            parts.push(`Desen: ${pattern}.`);
  if (age)                parts.push(`Yaklaşık yaş: ${age}.`);
  parts.push(`Profesyonelce temizlenmiş, kullanıma hazır.`);

  return parts.join(" ");
}
