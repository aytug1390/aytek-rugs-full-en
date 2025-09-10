export function ftToCm(ft) {
  if (ft === null || ft === undefined) return null;
  const s = String(ft).trim();
  if (s === '') return null;
  const n = Number(s.replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 30.48);
}
