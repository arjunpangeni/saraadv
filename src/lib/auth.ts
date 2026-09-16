import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { googleOAuthEnabled, safeCallbackUrl } from "@/lib/auth-utils";
import type { Role } from "@/generated/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      verified: boolean;
      emailVerified: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  interface User {
    role?: Role;
    verified?: boolean;
    emailVerified?: Date | boolean | null;
  }
}

const googleProvider =
  googleOAuthEnabled()
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
      ]
    : [];

const useSecureCookies = process.env.NODE_ENV === "production";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8, updateAge: 60 * 30 },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...googleProvider,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : undefined;
        const password = typeof credentials?.password === "string" ? credentials.password : undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
        });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;
        if (!user.emailVerified) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          verified: user.verified,
          emailVerified: user.emailVerified,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      const origin = baseUrl
        .replace("://0.0.0.0", "://localhost")
        .replace("://[::]", "://localhost");
      if (url.startsWith("/")) return `${origin}${safeCallbackUrl(url)}`;
      try {
        const next = new URL(url);
        if (next.origin === origin || next.origin === baseUrl) {
          return `${origin}${safeCallbackUrl(`${next.pathname}${next.search}`)}`;
        }
      } catch {
        /* fall through */
      }
      return `${origin}/dashboard`;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role;
        token.verified = (user as { verified?: boolean }).verified ?? false;
        token.emailVerified = Boolean(
          (user as { emailVerified?: Date | boolean | null }).emailVerified
        );
      }

      if (!token.id && token.sub) {
        token.id = token.sub;
      }

      if (account?.provider === "google" && token.id) {
        token.emailVerified = true;
      }

      if (token.id && trigger === "update") {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, verified: true, emailVerified: true },
          });
          if (!dbUser) return null;
          token.role = dbUser.role;
          token.verified = dbUser.verified;
          token.emailVerified = Boolean(dbUser.emailVerified);
        } catch {
          // Keep existing token claims if refresh fails
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.verified = Boolean(token.verified);
        (session.user as { emailVerified: boolean }).emailVerified = Boolean(token.emailVerified);
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.id) return;
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      }).catch(() => {});
    },
  },
});
