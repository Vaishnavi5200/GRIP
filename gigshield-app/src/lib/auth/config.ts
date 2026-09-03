import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { demoStore } from "@/lib/store/demo-store";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
        token.name = user.name;
        // @ts-expect-error - demoStore metadata
        token.organizationId = user.organizationId || demoStore.org.id;
        // @ts-expect-error - demoStore metadata
        token.role = user.role || "compliance_manager";
      }

      if (!token.organizationId) {
        token.organizationId = demoStore.org.id;
        token.role = token.role || "compliance_manager";
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        // @ts-expect-error - custom session field
        session.user.organizationId = (token.organizationId as string) || demoStore.org.id;
        // @ts-expect-error - custom session field
        session.user.role = (token.role as string) || "compliance_manager";
      }
      return session;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email } = parsed.data;

        // 1. Try demoStore users (guaranteed zero-latency offline demo reliability)
        const demoUser = demoStore.users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );

        if (demoUser) {
          demoStore.activeUser = demoUser;
          return {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            organizationId: demoUser.organizationId,
            role: demoUser.role,
          };
        }

        // 2. Default fallback for quick demo login
        return {
          id: "usr-demo-01",
          email: email.toLowerCase(),
          name: email.split("@")[0].toUpperCase(),
          organizationId: demoStore.org.id,
          role: "compliance_manager",
        };
      },
    }),
  ],
});
