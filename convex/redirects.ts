const allowedOrigins = new Set([
  "https://hanuman.dyut.si",
  "https://be-hanuman-next.vercel.app",
]);

export function hanumanRedirect(redirectTo: string): string {
  const url = new URL(redirectTo, "https://hanuman.dyut.si");
  if (!allowedOrigins.has(url.origin) || url.username || url.password) {
    throw new Error("Invalid sign-in return address");
  }
  return url.toString();
}
