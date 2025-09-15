import { jsonUtf8 } from '../../../src/lib/responses';
export async function GET() { return jsonUtf8({ ok: true, ts: Date.now() }); }
export async function HEAD() { return new Response(null, { status: 200 }); }
