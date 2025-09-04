import { dbConnect } from '../../../../../lib/db';
import User from '../../../../../models/User';

export async function GET(request, { params }) {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Disabled in production', { status: 403 });
  }
  await dbConnect();
  const email = decodeURIComponent(params.email).toLowerCase();
  const user = await User.findOne({ email }).lean();
  if (!user) return new Response('Not found', { status: 404 });
  const { passwordHash, __v, ...rest } = user;
  return Response.json(rest);
}
