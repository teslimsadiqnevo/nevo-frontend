import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { API_BASE_URL } from "@/shared/lib/api";
import { getApiTokenExpiryMs } from "@/shared/lib/apiTokenExpiry";

type AuthUserRecord = {
  id: string;
  name?: string;
  first_name?: string;
  email?: string;
  role?: string;
  school_id?: string | null;
  nevo_id?: string | null;
  student_id?: string | null;
};

type AuthApiResponse = {
  user?: AuthUserRecord;
  token?: string;
};

type SessionToken = {
  sub?: string;
  role?: string;
  apiToken?: string;
  apiTokenExpiresAt?: number | null;
  schoolId?: string | null;
  nevoId?: string | null;
  userId?: string;
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || "fallback-secret-for-development-only-123",
  trustHost: true,
  session: {
    strategy: "jwt",
  },
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

        const data = (await res.json()) as AuthApiResponse;

        if (res.ok && data && data.user) {
          return {
            id: data.user.id,
            name: data.user.name || data.user.first_name,
            email: data.user.email,
            role: data.user.role,
            apiToken: data.token,
            schoolId: data.user.school_id,
            nevoId: data.user.nevo_id || data.user.student_id,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const nextToken = token as SessionToken;
      const nextUser = user as { id?: string; role?: string; apiToken?: string; schoolId?: string | null; nevoId?: string | null } | undefined;

      if (user) {
        nextToken.userId = nextUser?.id;
        nextToken.role = nextUser?.role;
        nextToken.apiToken = nextUser?.apiToken;
        nextToken.apiTokenExpiresAt = getApiTokenExpiryMs(nextUser?.apiToken);
        nextToken.schoolId = nextUser?.schoolId ?? null;
        nextToken.nevoId = nextUser?.nevoId ?? null;
      }
      return nextToken;
    },
    async session({ session, token }) {
      const nextToken = token as SessionToken;
      if (session.user) {
        Object.assign(session.user, {
          id: nextToken.userId || nextToken.sub,
          role: nextToken.role,
          apiToken: nextToken.apiToken,
          apiTokenExpiresAt: nextToken.apiTokenExpiresAt,
          schoolId: nextToken.schoolId,
          nevoId: nextToken.nevoId,
        });
      }
      return session;
    },
  },
}); 
