import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";
import { hanumanRedirect } from "./redirects";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: { redirect: async ({ redirectTo }) => hanumanRedirect(redirectTo) },
});
