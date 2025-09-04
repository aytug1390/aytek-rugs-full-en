import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
	debug: !!process.env.NEXTAUTH_DEBUG,
	secret: process.env.NEXTAUTH_SECRET,
	trustHost: true,
	session: { strategy: "jwt" },
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email:    { label: "Email", type: "text" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				const email = credentials?.email?.trim();
				const pass  = credentials?.password;
				if (email === process.env.ADMIN_EMAIL && pass === process.env.ADMIN_PASSWORD) {
					return { id: "admin", name: "Admin", email, role: "admin" };
				}
				return null;
			},
		})
	],

	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.role = user.role || "admin";
				token.name = user.name;
				token.email = user.email;
			}
			return token;
		},
		async session({ session, token }) {
			session.user = {
				name:  token.name,
				email: token.email,
				role:  token.role || "admin",
			};
			return session;
		},
	},
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
