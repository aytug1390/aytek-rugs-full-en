import { dbConnect } from '../../../lib/db';
import MenuItem from '../../../models/MenuItem';

export async function GET() {
  await dbConnect();
  const items = await MenuItem.find().sort({ order: 1 });
  return Response.json(items);
}

export async function POST(req) {
  await dbConnect();
  let data;
  try { data = await req.json(); } catch { return new Response('Invalid JSON', { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' } }); }
  if (!data.label || !data.href) return new Response('label & href required', { status: 422, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' } });
  const roles = Array.isArray(data.roles)
    ? data.roles
    : (typeof data.roles === 'string' ? data.roles.split(',').map(r=>r.trim()).filter(Boolean) : []);
  const item = await MenuItem.create({
    label: data.label,
    href: data.href,
    order: data.order || 0,
    active: data.active !== false,
    roles
  });
  return new Response(JSON.stringify(item), { status: 201, headers: { 'Content-Type': 'application/json' } });
}
