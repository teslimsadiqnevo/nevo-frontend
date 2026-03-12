import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        nevoId: { label: "Nevo ID" },
        pin: { label: "PIN", type: "password" },
      },
      async authorize(credentials) {


        return null;
      },
    }),
  ],
});
