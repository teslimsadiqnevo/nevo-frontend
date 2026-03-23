import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || "fallback-secret-for-development-only-123",
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "text" },
        nevoId: { label: "Nevo ID", type: "text" },
        pin: { label: "PIN", type: "password" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        let payload;
        let endpoint = "https://api.nevolearning.com/api/v1/auth/login";

        if (credentials.email) {
          payload = { email: credentials.email, password: credentials.password };
        } else {
          payload = { nevo_id: credentials.nevoId, pin: credentials.pin };
          endpoint = "https://api.nevolearning.com/api/v1/auth/login/nevo-id";
        }

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (res.ok && data && data.user) {
          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            apiToken: data.token,
            schoolId: data.user.school_id,
          } as any;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.apiToken = (user as any).apiToken;
        token.schoolId = (user as any).schoolId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).apiToken = token.apiToken;
        (session.user as any).schoolId = token.schoolId;
      }
      return session;
    },
  },
}); 