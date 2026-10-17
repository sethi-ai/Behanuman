const allowedOrigins = new Set([
  "https://behanuman.com",
  "https://www.behanuman.com",
  "https://hanuman.dyut.si",
  "https://be-hanuman-next.vercel.app",
]);

export function hanumanRedirect(redirectTo: string): string {
  const previewOrigin = process.env.PREVIEW_AUTH_ORIGIN;
  const url = new URL(redirectTo, previewOrigin || "https://hanuman.dyut.si");
  if (!(allowedOrigins.has(url.origin) || (previewOrigin && url.origin === previewOrigin)) || url.username || url.password) {
    throw new Error("Invalid sign-in return address");
  }
  return url.toString();
}
