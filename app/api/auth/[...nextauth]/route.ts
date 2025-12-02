import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev.linkedtrust.us';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        const provider = account?.provider || 'unknown';
        console.log(`=== ${provider.toUpperCase()} OAUTH SIGNIN ===`);
        console.log(`${provider} sign-in attempt:`, user.email);
        console.log("User ID from provider:", user.id);
        console.log("API Base URL:", API_BASE_URL);
        
        // STEP 1: Try OAuth login first (for existing OAuth users)
        console.log("Step 1: Attempting OAuth login...");
        const oauthLoginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            password: `${provider}_oauth_${user.id}`,
          }),
        });

        console.log("OAuth login response status:", oauthLoginResponse.status);

        if (oauthLoginResponse.ok) {
          const loginData = await oauthLoginResponse.json();
          console.log("✅ Existing OAuth user logged in successfully");
          console.log("Full login response:", JSON.stringify(loginData, null, 2));
          
          (user as any).issuerId = loginData.user?.id;
          console.log("Stored issuer_id:", (user as any).issuerId);
          console.log(`=== END ${provider.toUpperCase()} SIGNIN (SUCCESS) ===`);
          return true;
        }

        // STEP 2: OAuth login failed, try to register as new user
        console.log("Step 2: OAuth login failed, attempting registration...");
        const registerResponse = await fetch(`${API_BASE_URL}/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            password: `${provider}_oauth_${user.id}`,
            name: user.name || user.email?.split('@')[0],
          }),
        });

        console.log("Register response status:", registerResponse.status);

        if (registerResponse.ok) {
          const registerData = await registerResponse.json();
          console.log("✅ New user registered successfully");
          console.log("Full register response:", JSON.stringify(registerData, null, 2));
          
          (user as any).issuerId = registerData.user?.id || registerData.issuer_id || registerData.issuerId || registerData.id;
          console.log("Stored issuer_id:", (user as any).issuerId);
          console.log(`=== END ${provider.toUpperCase()} SIGNIN (SUCCESS) ===`);
          return true;
        }

        // STEP 3: Registration failed with 409 - email exists with different password
        if (registerResponse.status === 409) {
          console.log("⚠️ Email already exists with email/password auth");
          console.log("📧 Account linking needed - user can sign in but won't have backend access");
          console.log("NOTE: User should either:");
          console.log("  1. Use their original email/password login, OR");
          console.log("  2. Contact admin to link account");
          console.log(`=== END ${provider.toUpperCase()} SIGNIN (PARTIAL - NO BACKEND LINK) ===`);
          
          return true;
        }

        // STEP 4: Other registration error
        const errorText = await registerResponse.text();
        console.error("❌ Registration failed with unexpected error:", errorText);
        console.log(`=== END ${provider.toUpperCase()} SIGNIN (FAILED) ===`);
        
        return true;

      } catch (error) {
        console.error(`❌ CRITICAL ERROR during ${account?.provider} OAuth backend integration:`, error);
        console.log("=== END OAUTH SIGNIN (ERROR) ===");
        return true;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        (token as any).issuerId = (user as any).issuerId;
        console.log("JWT callback - storing issuerId in token:", (user as any).issuerId);
      }
      return token;
    },
    async session({ session, token }) {
      if ((token as any).issuerId) {
        (session.user as any).issuerId = (token as any).issuerId;
        console.log("Session callback - storing issuerId in session:", (token as any).issuerId);
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});

export { handler as GET, handler as POST };