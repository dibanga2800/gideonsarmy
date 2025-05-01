import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, verifyPassword } from "@/lib/googleSheets";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('Login attempt failed: Missing credentials');
          throw new Error("Please enter both email and password");
        }

        try {
          console.log('Attempting login for email:', credentials.email);
          
          // Get user from Google Sheets
          const user = await getUserByEmail(credentials.email);
          
          if (!user) {
            console.error('Login failed: User not found:', credentials.email);
            throw new Error("Invalid email or password");
          }

          // Verify password
          const isPasswordValid = await verifyPassword(credentials.password, user.password);
          
          if (!isPasswordValid) {
            console.error('Login failed: Invalid password for user:', credentials.email);
            throw new Error("Invalid email or password");
          }

          console.log('Login successful for user:', credentials.email);

          // Return user object without password
          return {
            id: user.email, // Using email as ID since it's unique
            email: user.email,
            name: user.name,
            isAdmin: user.isAdmin
          };
        } catch (error) {
          console.error("Authentication error:", {
            message: error instanceof Error ? error.message : "Unknown error",
            email: credentials.email,
            timestamp: new Date().toISOString()
          });
          throw new Error(error instanceof Error ? error.message : "Authentication failed");
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    }
  },
  debug: process.env.NODE_ENV === "development"
}; 