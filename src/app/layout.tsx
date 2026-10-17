import "./learning.css";
import "./hi.css";
import type { Metadata, Viewport } from "next";
import "../restored/styles.css";
import "./iphone.css";
import "./desktop.css";
import "./welcome.css";
import "./home.css";
import "./install.css";
import ConvexClientProvider from "./ConvexClientProvider";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.behanuman.com'),
  alternates: { canonical: '/' },
  title: "Be Hanuman",
  description: "Make room for devotion, courage and steadiness with Hanuman Chalisa chanting, learning and reflection.",
  manifest: "/manifest.webmanifest",
  icons: { icon: [{url:"/icon-32.png?v=2",sizes:"32x32",type:"image/png"}], apple: [{ url: "/icon-180.png?v=2", sizes: "180x180", type: "image/png" }] },
  appleWebApp: { capable: true, title: "Be Hanuman", statusBarStyle: "default" },
  openGraph: { type:'website', url:'/', siteName:'Be Hanuman', title:'Be Hanuman', description:'A little space for daily devotion. Chant, learn and reflect.', images:[{url:'/share-gada.png',secureUrl:'https://www.behanuman.com/share-gada.png',type:'image/png',width:512,height:512,alt:'Be Hanuman golden gada icon.'}] },
  twitter: {card:'summary_large_image',title:'Be Hanuman',description:'A little space for daily devotion. Chant, learn and reflect.',images:[{url:'/social-preview.png',alt:'Be Hanuman with its golden gada.'}]},
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
