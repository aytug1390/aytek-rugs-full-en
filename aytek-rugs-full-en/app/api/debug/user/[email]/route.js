import { dbConnect } from '../../../../../lib/db';
import User from '../../../../../models/User';
import { jsonUtf8 } from '@/lib/responses';

export async function GET(request, { params }) {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Disabled in production', { status: 403, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' } });
  }
  await dbConnect();
  const email = decodeURIComponent(params.email).toLowerCase();
  const user = await User.findOne({ email }).lean();
  if (!user) return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' } });
  const { passwordHash, __v, ...rest } = user;
  return jsonUtf8(rest, { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff' } });
}

