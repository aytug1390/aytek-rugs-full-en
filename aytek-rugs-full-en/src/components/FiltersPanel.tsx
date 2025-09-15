"use client";
import { useState, useEffect } from "react";

export type Filters = {
  size?: string[];
  design?: string[];
  color?: string[];
  collection?: string[];
  stock?: ("in"|"sold")[];
  min_width?: string; // feet input
  max_width?: string; // feet input
  origin?: string[];
};
export default function FiltersPanel({ onChange, initial }:{ onChange:(f:Filters)=>void, initial?: Filters }) {
  const [f, setF] = useState<Filters>(initial ?? {});
  const [pending, setPending] = useState<Filters>(f);
  useEffect(() => {
    const t = setTimeout(() => onChange(pending), 200);
    return () => clearTimeout(t);
  }, [pending, onChange]);
  // keep internal state in sync if caller provides initial filters
  useEffect(() => {
    if (initial) {
      setF(initial);
      setPending(initial);
    }
  }, [initial]);
  function toggle<K extends keyof Filters>(key: K, val: NonNullable<Filters[K]>[number]) {
    setF(prev => {
      const arr = new Set<string>((prev[key] as string[]|undefined) ?? []);
      const sval = String(val);
      arr.has(sval) ? arr.delete(sval) : arr.add(sval);
      const next = { ...prev, [key]: Array.from(arr) } as Filters;
      setPending(next);
      return next;
    });
  }
  const Section = ({title, children}:{title:string,children:React.ReactNode}) => (
    <div className="border-b py-4">
      <h4 className="font-semibold mb-2">{title}</h4>
      {children}
    </div>
  );
  const Chip = ({checked,label,onClick}:{checked:boolean,label:string,onClick:()=>void}) => (
    <button type="button" onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-sm mr-2 mb-2 border ${checked?"bg-black text-white":"hover:bg-gray-100"}`}>
      {label}
    </button>
  );

  function parseFeetPart(s: string): number | null {
    if (!s) return null;
    const t = String(s).trim();
    // match formats like 6'11 or 6 11
    const m = t.match(/^(\d+)\s*(?:'|ft)?\s*(\d{1,2})?\s*(?:"|in)?$/);
    if (m) {
      const ft = Number(m[1]);
      const inches = m[2] ? Number(m[2]) : 0;
      if (!Number.isFinite(ft) || !Number.isFinite(inches)) return null;
      return ft + (inches/12);
    }
    // decimal number
    const n = Number(t.replace(',', '.'));
    if (Number.isFinite(n)) return n;
    return null;
  }

  function parseRangeInput(val: string) {
    if (!val || !String(val).includes('-')) return null;
    const parts = String(val).split(/-|–/).map(x=>x.trim()).filter(Boolean);
    if (parts.length === 0) return null;
    const left = parseFeetPart(parts[0]);
    let right: number | null = null;
    if (parts[1]) {
      // if right is integer without inches/decimal, treat as ft upto ft+11in
      const raw = parts[1];
      const mInt = raw.match(/^\d+$/);
      if (mInt) {
        right = Number(mInt[0]) + (11/12);
      } else {
        right = parseFeetPart(raw);
      }
    }
    return { min: left, max: right };
  }

  return (
    <aside className="w-full lg:w-64 xl:w-72 shrink-0">
      <div className="sticky top-20 border rounded-2xl p-4 bg-white">
        <h3 className="font-bold text-lg mb-2">Search Rugs</h3>

        <Section title="Size">
          { ["Small","Medium","Large","Oversize"].map(s=>(
            <Chip key={s} label={s} checked={!!f.size?.includes(s)} onClick={()=>toggle("size",s as any)} />
          )) }
        </Section>

        <Section title="Design">
          { ["Heriz","Hereke","Kilim","Medallion","Allover"].map(s=>(
            <Chip key={s} label={s} checked={!!f.design?.includes(s)} onClick={()=>toggle("design",s as any)} />
          )) }
        </Section>

        <Section title="Color">
          {/* Use canonical color-name values (these should match server-side `color_names`) */}
          { [
            { label: 'Ivory', value: 'white' },
            { label: 'Blue', value: 'blue' },
            { label: 'Red', value: 'red' },
            { label: 'Green', value: 'green' },
            { label: 'Brown', value: 'brown' },
          ].map(c => (
            <Chip key={c.value} label={c.label} checked={!!f.color?.includes(c.value)} onClick={()=>toggle("color", c.value as any)} />
          )) }
        </Section>

        <Section title="Collection">
          { ["Traditional","Modern","Vintage","Tribal","Silk"].map(s=>(
            <Chip key={s} label={s} checked={!!f.collection?.includes(s)} onClick={()=>toggle("collection",s as any)} />
          )) }
        </Section>

        <Section title="Stock Status">
          { ["in","sold"].map(s=>(
            <Chip key={s} label={s==="in"?"In Stock":"Sold"} checked={!!f.stock?.includes(s as any)} onClick={()=>toggle("stock",s as any)} />
          )) }
        </Section>
        <Section title="Origin">
          <input id="filter-origin" name="origin" value={(f.origin && f.origin[0]) || ''} onChange={e=>{ const v = e.target.value; setF(prev=>({ ...prev, origin: v ? [v] : [] })); setPending({ ...f, origin: v ? [v] : [] }); }} placeholder="e.g. Turkey" className="mt-1 px-2 py-1 border rounded w-full text-sm" />
        </Section>

        <Section title="Width (ft)">
          <div className="flex gap-2">
            <input id="filter-min-width" name="min_width" value={f.min_width || ''} onChange={e=>{ setF(prev=>({ ...prev, min_width: e.target.value })); setPending({ ...f, min_width: e.target.value }); }} placeholder="min ft" className="px-2 py-1 border rounded w-20 text-sm" />
            <input id="filter-max-width" name="max_width" value={f.max_width || ''} onChange={e=>{ setF(prev=>({ ...prev, max_width: e.target.value })); setPending({ ...f, max_width: e.target.value }); }} placeholder="max ft" className="px-2 py-1 border rounded w-20 text-sm" />
          </div>
        </Section>

          <button type="button" className="w-full mt-3 rounded-xl border py-2 hover:bg-gray-50"
          onClick={()=>{ setF({}); setPending({}); /* debounce will call onChange */ }}>
          Clear Filters
        </button>
      </div>
    </aside>
  );
}

