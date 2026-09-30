import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // Supabase OAuth & Auth Token Provider
    CredentialsProvider({
      id: "supabase",
      name: "Supabase",
      credentials: {
        accessToken: { label: "Access Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.accessToken) {
          throw new Error("Missing Supabase access token");
        }

        if (!supabaseAdmin) {
          throw new Error("Supabase is not configured on the server");
        }

        const { data, error } = await supabaseAdmin.auth.getUser(credentials.accessToken);
        if (error || !data?.user || !data.user.email) {
          throw new Error(error?.message || "Invalid Supabase session token");
        }

        const sbUser = data.user;
        const email = (sbUser.email as string).toLowerCase().trim();

        let user = await db.user.findUnique({
          where: { email },
        });

        if (!user) {
          const fullName =
            sbUser.user_metadata?.full_name ||
            sbUser.user_metadata?.name ||
            email.split("@")[0];
          const avatarUrl =
            sbUser.user_metadata?.avatar_url ||
            sbUser.user_metadata?.picture ||
            null;

          user = await db.user.create({
            data: {
              email,
              name: fullName,
              image: avatarUrl,
              role: "STUDENT",
            },
          });

          await db.profile.create({
            data: {
              userId: user.id,
              headline: "Student at Connect",
              targetRole: "Software Engineer",
              readinessScore: 25,
            },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || "Student",
          image: user.image,
          role: user.role,
        };
      },
    }),

    // Firebase Auth & Google Token Provider
    CredentialsProvider({
      id: "firebase",
      name: "Firebase",
      credentials: {
        idToken: { label: "ID Token", type: "text" },
        email: { label: "Email", type: "text" },
        name: { label: "Name", type: "text" },
        image: { label: "Image", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error("Missing email from Firebase authentication");
        }

        const email = credentials.email.toLowerCase().trim();

        let user = await db.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await db.user.create({
            data: {
              email,
              name: credentials.name || email.split("@")[0],
              image: credentials.image || null,
              role: "STUDENT",
            },
          });

          await db.profile.create({
            data: {
              userId: user.id,
              headline: "Student at Connect",
              targetRole: "Software Engineer",
              readinessScore: 25,
            },
          });
        } else if (credentials.image && !user.image) {
          await db.user.update({
            where: { id: user.id },
            data: { image: credentials.image },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || "Student",
          image: user.image,
          role: user.role,
        };
      },
    }),

    // Standard Email & Password Credentials
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@connect.dev" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || "Student",
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const email = user.email.toLowerCase().trim();
        let dbUser = await db.user.findUnique({ where: { email } });
        if (!dbUser) {
          dbUser = await db.user.create({
            data: {
              email,
              name: user.name || "Student",
              image: user.image,
              role: "STUDENT",
            },
          });
          await db.profile.create({
            data: {
              userId: dbUser.id,
              headline: "Student at Connect",
              targetRole: "Software Engineer",
              readinessScore: 25,
            },
          });
        }
        user.id = dbUser.id;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "STUDENT";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  secret: env.NEXTAUTH_SECRET,
};
