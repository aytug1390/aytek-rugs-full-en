"use client";
import { useState, useEffect } from "react";

export type Filters = {
  size?: string[];
  design?: string[];
  color?: string[];
  collection?: string[];
  stock?: ("in"|"sold")[];
};
export default function FiltersPanel({ onChange }:{ onChange:(f:Filters)=>void }) {
  const [f, setF] = useState<Filters>({});
  const [pending, setPending] = useState<Filters>(f);
  useEffect(() => {
    const t = setTimeout(() => onChange(pending), 200);
    return () => clearTimeout(t);
  }, [pending, onChange]);
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
    <button onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-sm mr-2 mb-2 border ${checked?"bg-black text-white":"hover:bg-gray-100"}`}>
      {label}
    </button>
  );

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
          { ["Ivory","Blue","Red","Green","Multi"].map(s=>(
            <Chip key={s} label={s} checked={!!f.color?.includes(s)} onClick={()=>toggle("color",s as any)} />
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

        <button className="w-full mt-3 rounded-xl border py-2 hover:bg-gray-50"
          onClick={()=>{ setF({}); setPending({}); /* debounce will call onChange */ }}>
          Clear Filters
        </button>
      </div>
    </aside>
  );
}

