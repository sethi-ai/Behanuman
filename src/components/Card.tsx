import type { Card as CardT } from "@/lib/deck";

export type Lang = "hing" | "hi";

const Bar = ({ children }: { children: string }) => <i className="bar">{children}</i>;

export default function Card({ card, lang, index, theme }: { card: CardT; lang: Lang; index: number; theme: string }) {
  const art = (
    <div className="art">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={theme!=="light"?`/images/dark/${card.img}.webp`:`/images/${card.img}.jpg`} alt={`Hanuman, card ${index + 1}`} draggable={false} />
    </div>
  );

  if (card.kind === "jaikara") {
    return (
      <section className="card" data-tier="0">
        <div className="wrap jk">
          {art}
          {card.lines.map((l) => (
            <div key={l.hing} className="jv">
              <div className="verse jverse">
                <span>{lang === "hing" ? l.hing : l.dev}</span>
              </div>
              <p className="mt jmt">{lang === "hing" ? l.en : l.hi}</p>
            </div>
          ))}
          <div className="verse jverse jrn">
            {(lang === "hing" ? card.rn.hing : card.rn.dev).map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <p className="rep">
            <Bar>||</Bar> Chant 11 times <Bar>||</Bar>
          </p>
        </div>
      </section>
    );
  }

  const lines = lang === "hing" ? card.hing : card.dev;
  return (
    <section className="card" data-tier={card.tier}>
      <div className="wrap">
        {art}
        <div className="verse">
          <span>
            {lines[0]} <Bar>|</Bar>
          </span>
          <span>
            {lines[1]} <Bar>||</Bar>
          </span>
        </div>
        <div className="mean">
          <p className="mt">{lang === "hing" ? card.mt : card.mtHi}</p>
          <p className="ex">{lang === "hing" ? card.ex : card.exHi}</p>
        </div>
      </div>
    </section>
  );
}
