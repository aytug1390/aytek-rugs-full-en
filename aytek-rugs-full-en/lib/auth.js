import Credentials from 'next-auth/providers/credentials';
import { dbConnect } from './db';
import User from '../models/User';
import bcrypt from 'bcrypt';

// Basic runtime env validation (avoid silent 500)
if (!process.env.NEXTAUTH_SECRET) {
  console.warn('[auth] NEXTAUTH_SECRET not set at load time');
}

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials.password) return null;
          await dbConnect();
          const email = credentials.email.toLowerCase().trim();
          const user = await User.findOne({ email });
          if (!user) {
            console.warn('[auth] user not found', email);
            return null;
          }
          if (!user.passwordHash) {
            console.warn('[auth] missing passwordHash for user', email);
            return null;
          }
          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) {
            console.warn('[auth] invalid password', email);
            return null;
          }
          user.lastLoginAt = new Date();
          await user.save();
          return { id: user._id.toString(), name: user.name, email: user.email, roles: user.roles || [] };
        } catch (e) {
          console.error('[auth] authorize error', e);
          return null;
        }
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.roles = user.roles;
      return token;
    },
    async session({ session, token }) {
      if (token?.roles) session.user.roles = token.roles;
      return session;
    }
  },
  // Use public /login page (outside /admin) to avoid middleware guard loop
  pages: { signIn: '/login' }
};
