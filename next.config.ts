import type { NextConfig } from "next";

// EXPORT=1 builds plain static files (used for file:// previews and static hosting).
// Cache Components / partial prefetching can't run in export mode, so they are only on for normal builds.
const exporting = Boolean(process.env.EXPORT);

const nextConfig: NextConfig = {
  ...(exporting ? { output: "export" as const } : { cacheComponents: true, partialPrefetching: true }),
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
