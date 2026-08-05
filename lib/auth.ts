import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

function getAllowedAdminEmails() {
  return new Set(
    [process.env.ADMIN_ALLOWED_EMAILS, process.env.ADMIN_EMAIL]
      .filter(Boolean)
      .join(",")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function isAllowedAdminEmail(email: string | null | undefined) {
  const allowedEmails = getAllowedAdminEmails();

  return Boolean(email && allowedEmails.has(email.toLowerCase()));
}

export function getConfiguredAdminProviders() {
  return [
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? { id: "github", name: "GitHub" }
      : null,
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? { id: "google", name: "Google" }
      : null,
    process.env.ADMIN_EMAIL &&
    process.env.ADMIN_PASSWORD &&
    (process.env.NODE_ENV !== "production" ||
      process.env.ENABLE_ADMIN_PASSWORD_AUTH === "true")
      ? { id: "credentials", name: "Password" }
      : null,
  ].filter((provider): provider is { id: string; name: string } =>
    Boolean(provider),
  );
}

const providers: NextAuthOptions["providers"] = [];

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  );
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (
  process.env.ADMIN_EMAIL &&
  process.env.ADMIN_PASSWORD &&
  (process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_ADMIN_PASSWORD_AUTH === "true")
) {
  providers.push(
    CredentialsProvider({
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (
          email &&
          password &&
          email === process.env.ADMIN_EMAIL &&
          password === process.env.ADMIN_PASSWORD &&
          isAllowedAdminEmail(email)
        ) {
          return {
            id: email,
            email,
            name: "CMM Admin",
          };
        }

        return null;
      },
    }),
  );
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  providers,
  callbacks: {
    signIn({ user }) {
      return isAllowedAdminEmail(user.email);
    },
    session({ session }) {
      return session;
    },
  },
};

export function getAdminSession() {
  return getServerSession(authOptions);
}

export async function requireAdmin() {
  const session = await getAdminSession();

  if (!session?.user?.email) {
    throw new Error("Admin authentication required.");
  }

  return session;
}
