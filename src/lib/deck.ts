import chalisa from "@/data/chalisa.json";
import extras from "@/data/extras.json";
import hindi from "@/data/hindi.json";

type HindiEntry = { m?: string; e?: string };
const HI = hindi as Record<string, HindiEntry | string>;

export type SizeTier = 0 | 1 | 2 | 3;

export type VerseCard = {
  kind: "verse";
  id: string;
  label: string; // "Doha 1", "Chaupai 7", "Closing Doha"
  img: string; // file number, e.g. "07"
  hing: [string, string];
  dev: [string, string];
  mt: string;
  ex: string;
  mtHi: string;
  exHi: string;
  tier: SizeTier;
};

export type JaikaraCard = {
  kind: "jaikara";
  id: string;
  label: string;
  img: string;
  lines: { dev: string; hing: string; en: string; hi: string }[];
  rn: { dev: [string, string]; hing: [string, string]; note: string };
};

export type Card = VerseCard | JaikaraCard;

const pad = (n: number) => (n < 10 ? "0" : "") + n;
const strip = (s: string) => s.replace(/[।॥\s]+$/, "");

/**
 * Text-size tier chosen from text length at build time.
 * v1 measured the DOM in a loop and shrank the meaning text on resize and on font load,
 * which is why text kept jumping. Here the size is fixed per card, so it never changes at runtime.
 */
function tierFor(mt: string, ex: string, mtHi: string, exHi: string): SizeTier {
  const en = mt.length + ex.length;
  const hi = mtHi.length + exHi.length;
  const worst = Math.max(en, hi * 0.9);
  if (worst > 340) return 3;
  if (worst > 280) return 2;
  if (worst > 220) return 1;
  return 0;
}

function hindiKey(c: { n: number; kl: string }) {
  return c.n ? `C${c.n}` : c.kl === "Doha 1" ? "D0" : c.kl === "Doha 2" ? "D2" : "D41";
}

type Raw = { k: string; kl: string; n: number; dev: string[]; hing: string[]; mt: string; ex: string; img?: string };

function toVerse(c: Raw, img: string): VerseCard {
  const entry = HI[hindiKey(c)];
  const h = typeof entry === "string" ? {} : entry ?? {};
  const mtHi = h.m ?? c.mt;
  const exHi = h.e ?? c.ex;
  return {
    kind: "verse",
    id: hindiKey(c),
    label: c.n ? `Chaupai ${c.n}` : c.kl,
    img,
    hing: [c.hing[0], c.hing[1]],
    dev: [strip(c.dev[0]), strip(c.dev[1])],
    mt: c.mt,
    ex: c.ex,
    mtHi,
    exHi,
    tier: tierFor(c.mt, c.ex, mtHi, exHi),
  };
}

function build(): Card[] {
  const out: Card[] = [];
  (chalisa as Raw[]).forEach((c, i) => {
    out.push(toVerse(c, pad(i + 1)));
    if (i === 0) out.push(toVerse(extras.op2 as Raw, "opening2"));
  });
  const jk = extras.jk;
  out.push({
    kind: "jaikara",
    id: "JK",
    label: "Jaikara",
    img: "jaikara2",
    lines: jk.lines.map((l, q) => {const h=HI[`J${q + 1}`];return { ...l, hi:typeof h === "string" ? h : h?.m ?? l.en };}),
    rn: { dev: [jk.rn.dev[0], jk.rn.dev[1]], hing: [jk.rn.hing[0], jk.rn.hing[1]], note: jk.rn.note },
  });
  return out;
}

export const DECK: Card[] = build();
export const DECK_SIZE = DECK.length;
