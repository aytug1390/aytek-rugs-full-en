import { dbConnect } from '../../../../lib/db';
import User from '../../../../models/User';
import bcrypt from 'bcrypt';

export async function POST(req) {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Disabled in production', { status: 403 });
  }
  await dbConnect();
  let body; try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }
  const email = (body.email||'').toLowerCase().trim();
  const password = body.password;
  if (!email || !password) return new Response('email & password required', { status: 422 });
  let user = await User.findOne({ email });
  const passwordHash = await bcrypt.hash(password, 10);
  if (!user) {
    user = await User.create({ email, passwordHash, roles: ['admin'] });
    return new Response(JSON.stringify({ ok: true, created: true }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } else {
    user.passwordHash = passwordHash;
    if (!user.roles?.includes('admin')) {
      user.roles = Array.isArray(user.roles) ? Array.from(new Set([...user.roles, 'admin'])) : ['admin'];
    }
    await user.save();
    return new Response(JSON.stringify({ ok: true, updated: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}
