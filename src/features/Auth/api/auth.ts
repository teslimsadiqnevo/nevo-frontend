import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { API_BASE_URL } from "@/shared/lib/api";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || "fallback-secret-for-development-only-123",
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "text" },
        firstName: { label: "First Name", type: "text" },
        nevoId: { label: "Nevo ID", type: "text" },
        pin: { label: "PIN", type: "password" },
        password: { label: "Password", type: "password" },
        loginType: { label: "Login Type", type: "text" },
        verificationToken: { label: "Verification Token", type: "text" },
      },
      async authorize(credentials) {
        let payload;
        let endpoint = `${API_BASE_URL}/auth/login`;
        let method: "GET" | "POST" = "POST";
        let body: string | undefined;

        if (credentials.loginType === "email_verification" && credentials.verificationToken) {
          endpoint = `${API_BASE_URL}/auth/teacher/verify-email`;
          payload = { token: credentials.verificationToken };
          method = "POST";
        } else if (credentials.email) {
          // Teacher / School admin login
          payload = { email: credentials.email, password: credentials.password };
          if (credentials.loginType === "teacher") {
            endpoint = `${API_BASE_URL}/auth/teacher/login`;
          } else if (credentials.loginType === "school") {
            endpoint = `${API_BASE_URL}/auth/school/login`;
          }
        } else {
          // Student login — send first_name + nevo_id + pin per backend spec
          payload = {
            first_name: credentials.firstName,
            nevo_id: credentials.nevoId,
            pin: credentials.pin,
          };
          endpoint = `${API_BASE_URL}/auth/student/login`;
        }

        if (method === "POST") {
          body = JSON.stringify(payload);
        }

        const res = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body,
        });

        const data = await res.json();

        if (res.ok && data && data.user) {
          return {
            id: data.user.id,
            name: data.user.name || data.user.first_name,
            email: data.user.email,
            role: data.user.role,
            apiToken: data.token,
            schoolId: data.user.school_id,
            nevoId: data.user.nevo_id || data.user.student_id,
          } as any;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as any).id;
        token.role = (user as any).role;
        token.apiToken = (user as any).apiToken;
        token.schoolId = (user as any).schoolId;
        token.nevoId = (user as any).nevoId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).userId || token.sub;
        (session.user as any).role = token.role;
        (session.user as any).apiToken = token.apiToken;
        (session.user as any).schoolId = token.schoolId;
        (session.user as any).nevoId = token.nevoId;
      }
      return session;
    },
  },
}); 
