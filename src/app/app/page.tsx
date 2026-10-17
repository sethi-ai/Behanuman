import Script from "next/script";
import { readFileSync } from "node:fs";
import path from "node:path";
const body = readFileSync(path.join(process.cwd(), "src/restored/body.html"), "utf8");

export default function Page() {
  return <>
    <div id="practice-entry-shell" className="practice-entry-check" role="status">Opening your practice…</div>
    <div id="original-renderer" dangerouslySetInnerHTML={{ __html: body }} />
    <Script src="/restored/engine.js" strategy="afterInteractive" />
  </>;
}
