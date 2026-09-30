import { useEffect, useMemo, useState } from "react";

type Props = {
  onScore: (score: number, final: boolean) => void;
};

type Card = { id: number; glyph: string; flipped: boolean; matched: boolean };

const GLYPHS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(): Card[] {
  return shuffle([...GLYPHS, ...GLYPHS]).map((glyph, id) => ({
    id,
    glyph,
    flipped: false,
    matched: false,
  }));
}

export function EchoMemory({ onScore }: Props) {
  const [cards, setCards] = useState<Card[]>(() => buildDeck());
  const [picked, setPicked] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  const matchedCount = useMemo(() => cards.filter((c) => c.matched).length, [cards]);
  const done = matchedCount === cards.length && cards.length > 0;
  const score = Math.max(0, 800 - moves * 20 + matchedCount * 15);

  useEffect(() => {
    onScore(score, done);
  }, [score, done, onScore]);

  const reset = () => {
    setCards(buildDeck());
    setPicked([]);
    setMoves(0);
    setLocked(false);
    onScore(0, false);
  };

  const flip = (id: number) => {
    if (locked) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched || picked.includes(id)) return;
    if (picked.length >= 2) return;

    const nextPicked = [...picked, id];
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, flipped: true } : c)));
    setPicked(nextPicked);

    if (nextPicked.length < 2) return;

    setLocked(true);
    setMoves((m) => m + 1);
    const [a, b] = nextPicked;

    window.setTimeout(() => {
      setCards((prev) => {
        const first = prev.find((c) => c.id === a);
        const second = prev.find((c) => c.id === b);
        const ok = Boolean(first && second && first.glyph === second.glyph);
        return prev.map((c) => {
          if (c.id !== a && c.id !== b) return c;
          if (ok) return { ...c, matched: true, flipped: true };
          return { ...c, flipped: false };
        });
      });
      setPicked([]);
      setLocked(false);
    }, 900);
  };

  return (
    <div className="game-wrap">
      <div className="game-hud">
        <span>
          Score {score} · Coups {moves}
        </span>
        <button type="button" className="ghost-btn" onClick={reset}>
          Relancer
        </button>
      </div>
      <div className="memory-grid" role="grid">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`mem-card ${card.flipped || card.matched ? "open" : ""} ${card.matched ? "matched" : ""}`}
            onClick={() => flip(card.id)}
            aria-label={card.flipped || card.matched ? card.glyph : "carte cachée"}
          >
            {(card.flipped || card.matched) && card.glyph}
          </button>
        ))}
      </div>
      {done && <p className="hint">Écho complet — score final {score}</p>}
    </div>
  );
}
