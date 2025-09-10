"use client";
import { useState, useEffect } from 'react';
import { ftToCm } from '../lib/ftToCm';
import { useRouter, useSearchParams } from 'next/navigation';

// use shared ftToCm helper

export default function Filters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sp = searchParams || new URLSearchParams();
  const [color, setColor] = useState(sp.get('color') || '');
  const [origin, setOrigin] = useState(sp.get('origin') || '');
  const [minFt, setMinFt] = useState(sp.get('min_width') ? String(Math.round(Number(sp.get('min_width'))/30.48*100)/100) : '');
  const [maxFt, setMaxFt] = useState(sp.get('max_width') ? String(Math.round(Number(sp.get('max_width'))/30.48*100)/100) : '');

  useEffect(() => {
    const s = searchParams || new URLSearchParams();
    setColor(s.get('color') || '');
    setOrigin(s.get('origin') || '');
    setMinFt(s.get('min_width') ? String(Math.round(Number(s.get('min_width'))/30.48*100)/100) : '');
    setMaxFt(s.get('max_width') ? String(Math.round(Number(s.get('max_width'))/30.48*100)/100) : '');
  }, [searchParams]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function applyFilters(e) {
    try {
  e?.preventDefault();
  console.log('[filters] applyFilters invoked', { color, origin, minFt, maxFt });
      setError('');
      setBusy(true);

      // build params from current searchParams safely
      const cur = new URLSearchParams();
      const sp = searchParams || new URLSearchParams();
      for (const [k, v] of sp.entries()) cur.set(k, v);

      // update color
      if (color && color.trim()) cur.set('color', color.trim()); else cur.delete('color');
      // update origin
      if (origin && origin.trim()) cur.set('origin', origin.trim()); else cur.delete('origin');
      // convert ft to cm and set numeric params
  const minCm = ftToCm(minFt);
  const maxCm = ftToCm(maxFt);
  // don't add zero values — treat empty/zero as 'not set'
  if (minCm != null && minCm !== 0) cur.set('min_width', String(minCm)); else cur.delete('min_width');
  if (maxCm != null && maxCm !== 0) cur.set('max_width', String(maxCm)); else cur.delete('max_width');

      // reset to first page
      cur.delete('page');

      const out = `/all-rugs?${cur.toString()}`;
      console.log('[filters] applying', { out, color, origin, minFt, maxFt, minCm, maxCm });
      // router.push can throw if called during navigation; wrap in try/catch
      // If URL equals current search, Next may do nothing — force refresh in that case.
      const curStr = (searchParams || new URLSearchParams()).toString();
      const outStr = cur.toString();
      // Await router.push so we know navigation completed (or started) in Next.
      try {
        await router.push(out);
      } catch (e) {
        console.warn('[filters] router.push failed', e);
      }
      // Try a soft refresh to ensure server-rendered portions update.
      try { await router.refresh(); } catch (e) { console.warn('refresh failed', e); }

      // Fallback: if the browser URL didn't change after a short delay, perform a full reload.
      setTimeout(() => {
        try {
          if (typeof window !== 'undefined') {
            const loc = window.location.pathname + (window.location.search || '');
            if (loc !== out) {
              window.location.href = out;
            }
          }
        } catch (e) {
          /* ignore */
        }
      }, 1000);
    } catch (err) {
      console.error('applyFilters error', err);
      setError(String(err?.message || err));
    } finally {
      setBusy(false);
    }
  }

  async function resetFilters() {
    const params = new URLSearchParams(Array.from((searchParams || new URLSearchParams()).entries()));
    params.delete('color'); params.delete('origin'); params.delete('min_width'); params.delete('max_width'); params.delete('page');
    const out = `/all-rugs?${params.toString()}`;
    const curStr = (searchParams || new URLSearchParams()).toString();
    const outStr = params.toString();
    await router.push(out);
    if (curStr === outStr) {
      try { router.refresh(); } catch (e) { console.warn('refresh failed', e); }
    }
  }

  return (
    <form onSubmit={applyFilters} className="mb-4 flex flex-wrap gap-3 items-end">
      <div>
        <label htmlFor="color-input" className="block text-xs text-gray-600">Color (code)</label>
        <input id="color-input" name="color" value={color} onChange={e => setColor(e.target.value)} placeholder="e.g. red,blue" className="mt-1 px-2 py-1 border rounded text-sm" />
      </div>

      <div>
        <label htmlFor="origin-select" className="block text-xs text-gray-600">Origin</label>
        <select id="origin-select" name="origin" value={origin} onChange={e => setOrigin(e.target.value)} className="mt-1 px-2 py-1 border rounded text-sm">
          <option value="">Any</option>
          <option value="Turkey">Turkey</option>
        </select>
      </div>

      <div>
        <label htmlFor="min-width-input" className="block text-xs text-gray-600">Min width (ft)</label>
        <input id="min-width-input" name="min_width" value={minFt} onChange={e => setMinFt(e.target.value)} placeholder="e.g. 4.5" className="mt-1 px-2 py-1 border rounded w-24 text-sm" />
      </div>

      <div>
        <label htmlFor="max-width-input" className="block text-xs text-gray-600">Max width (ft)</label>
        <input id="max-width-input" name="max_width" value={maxFt} onChange={e => setMaxFt(e.target.value)} placeholder="e.g. 8" className="mt-1 px-2 py-1 border rounded w-24 text-sm" />
      </div>

      <div className="flex gap-2 items-center">
  <button disabled={busy} type="button" onClick={applyFilters} className={`mt-1 px-3 py-1 ${busy? 'bg-gray-400':'bg-blue-600'} text-white rounded text-sm`}>Apply</button>
        <button type="button" onClick={resetFilters} className="mt-1 px-3 py-1 bg-gray-200 rounded text-sm">Reset</button>
        {error ? <div className="text-sm text-red-600 ml-3">{error}</div> : null}
      </div>
    </form>
  );
}
