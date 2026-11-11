import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import type { NextAuthConfig } from 'next-auth';

export const isAuthConfigured = Boolean(
  process.env.AUTH_SECRET && process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
);

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || 'neuralpath-local-dev-placeholder-secret-do-not-use-in-prod',
  providers: isAuthConfigured
    ? [
        GitHub({
          clientId: process.env.AUTH_GITHUB_ID!,
          clientSecret: process.env.AUTH_GITHUB_SECRET!,
        }),
      ]
    : [],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/dashboard',
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

