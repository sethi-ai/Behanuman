import "./learning.css";
import type { Metadata, Viewport } from "next";
import "../restored/styles.css";
import "./iphone.css";
import "./desktop.css";
import "./welcome.css";
import ConvexClientProvider from "./ConvexClientProvider";

export const metadata: Metadata = {
  title: "Be Hanuman: Hanuman Chalisa",
  description: "Learn the Hanuman Chalisa one verse at a time. English or Hindi, with a short meaning.",
  manifest: "/manifest.webmanifest",
  icons: { apple: [{ url: "/icon-180.png", sizes: "180x180", type: "image/png" }] },
  appleWebApp: { capable: true, title: "Be Hanuman", statusBarStyle: "default" },
  openGraph: { title: "Be Hanuman: Hanuman Chalisa", description: "Learn the Hanuman Chalisa one verse at a time." },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e3e3e1",
};

const PRELOAD = [
  "khand-latin-500-normal.woff2",
  "khand-devanagari-500-normal.woff2",
  "kalam-latin-400-normal.woff2",
  "kalam-devanagari-400-normal.woff2",
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {PRELOAD.map((f) => (
          <link key={f} rel="preload" as="font" type="font/woff2" href={`/fonts/${f}`} crossOrigin="anonymous" />
        ))}
      </head>
      <body><ConvexClientProvider>{children}</ConvexClientProvider></body>
    </html>
  );
}
