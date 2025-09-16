export function getBucket(key = "ab-quote", ratio = 0.5) {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return stored;
    const v = Math.random() < ratio ? "A" : "B";
    localStorage.setItem(key, v);
    return v;
  } catch {
    return "A";
  }
}
