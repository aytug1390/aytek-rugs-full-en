import { dbConnect } from '../../../../lib/db';
import MenuItem from '../../../../models/MenuItem';

export async function PUT(req, { params }) {
  await dbConnect();
  let data; try { data = await req.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }
  let roles;
  if (data.roles !== undefined) {
    if (Array.isArray(data.roles)) roles = data.roles;
    else if (typeof data.roles === 'string') roles = data.roles.split(',').map(r=>r.trim()).filter(Boolean);
    else roles = [];
  }
  const $set = { };
  if (data.label) $set.label = data.label;
  if (data.href) $set.href = data.href;
  if (data.order !== undefined) $set.order = data.order;
  if (data.active !== undefined) $set.active = data.active;
  if (roles !== undefined) $set.roles = roles;
  const item = await MenuItem.findByIdAndUpdate(params.id, { $set }, { new: true });
  if (!item) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(item), { headers: { 'Content-Type': 'application/json' } });
}

export async function DELETE(req, { params }) {
  await dbConnect();
  const deleted = await MenuItem.findByIdAndDelete(params.id);
  if (!deleted) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
}
