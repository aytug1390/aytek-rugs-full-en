import 'dotenv/config';

const PROXY = process.env.NEXT_PUBLIC_PROXY_ORIGIN || process.env.PROXY || 'http://127.0.0.1:3000';
const endpoint = `${PROXY}/api/admin-api/products`;

function buildUrl(params){
  const u = new URL(endpoint);
  for(const [k,v] of Object.entries(params)){
    if (v === undefined || v === null) continue;
    u.searchParams.set(k, String(v));
  }
  // ensure read-only fast path
  u.searchParams.set('count_only','1');
  return u.toString();
}

const cases = [
  { name: 'base (no extra filters)', params: {} },
  { name: 'text search "Kilim"', params: { q: 'Kilim' } },
  { name: 'color=brown', params: { color: 'brown' } },
  { name: 'origin=Turkey', params: { origin: 'Turkey' } },
  { name: 'width 180-200 cm', params: { min_width: 180, max_width: 200 } },
  { name: 'height 200-300 cm', params: { min_height: 200, max_height: 300 } },
  { name: 'color=brown,red + origin=Turkey', params: { color: 'brown,red', origin: 'Turkey' } },
  { name: 'include no-image products', params: { include_no_image: '1' } },
  { name: 'only has_image=1', params: { has_image: '1' } }
];

(async()=>{
  console.log('Using proxy endpoint:', endpoint);
  for(const c of cases){
    const url = buildUrl(c.params);
    try{
      const r = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
      const body = await r.json();
      const total = typeof body.total === 'number' ? body.total : (body.total || (body.items? body.items.length : 'N/A'));
      console.log(`\n[${c.name}] -> total: ${total}`);
      if (body._debug) console.log(' _debug counts:', body._debug.counts);
    }catch(e){
      console.error(`\n[${c.name}] failed:`, e && e.message ? e.message : e);
    }
  }
  process.exit(0);
})();
