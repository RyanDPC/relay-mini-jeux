import { useEffect, useState } from "react";
import { type Card, freshDeck, isRed, rankValue, shuffle } from "./cards";
import { PlayingCard } from "./PlayingCard";
import "./Cards.css";

type Props = { onScore: (score: number, final: boolean) => void };

type Piles = {
  stock: Card[];
  waste: Card[];
  foundations: Card[][];
  tableau: Card[][];
};

function deal(): Piles {
  const deck = shuffle(freshDeck(false));
  const tableau: Card[][] = [[], [], [], [], [], [], []];
  let i = 0;
  for (let col = 0; col < 7; col++) {
    for (let n = 0; n <= col; n++) {
      const card = deck[i++];
      card.faceUp = n === col;
      tableau[col].push(card);
    }
  }
  return {
    stock: deck.slice(i),
    waste: [],
    foundations: [[], [], [], []],
    tableau,
  };
}

function canStackOnTableau(moving: Card, target?: Card): boolean {
  if (!target) return moving.rank === "K";
  return (
    isRed(moving.suit) !== isRed(target.suit) &&
    rankValue(moving.rank) === rankValue(target.rank) - 1
  );
}

function canStackOnFoundation(card: Card, foundation: Card[]): boolean {
  if (foundation.length === 0) return card.rank === "A";
  const top = foundation[foundation.length - 1];
  return (
    top.suit === card.suit && rankValue(card.rank) === rankValue(top.rank) + 1
  );
}

export function Solitaire({ onScore }: Props) {
  const [piles, setPiles] = useState<Piles>(() => deal());
  const [selected, setSelected] = useState<{
    from: "waste" | "tableau" | "foundation";
    col?: number;
    index?: number;
  } | null>(null);
  const [moves, setMoves] = useState(0);

  const foundationsDone = piles.foundations.reduce((n, f) => n + f.length, 0);
  const score = foundationsDone * 100 - moves * 2;
  const won = foundationsDone === 52;

  useEffect(() => {
    onScore(Math.max(0, score), won);
  }, [score, won, onScore]);

  const reset = () => {
    setPiles(deal());
    setSelected(null);
    setMoves(0);
    onScore(0, false);
  };

  const draw = () => {
    setPiles((p) => {
      if (p.stock.length === 0) {
        return {
          ...p,
          stock: [...p.waste].reverse().map((c) => ({ ...c, faceUp: false })),
          waste: [],
        };
      }
      const next = [...p.stock];
      const card = { ...next.pop()!, faceUp: true };
      return { ...p, stock: next, waste: [...p.waste, card] };
    });
    setSelected(null);
    setMoves((m) => m + 1);
  };

  const selectWaste = () => {
    if (piles.waste.length === 0) return;
    setSelected({ from: "waste" });
  };

  const tryMoveToFoundation = (fi: number) => {
    if (!selected) return;
    setPiles((p) => {
      let card: Card | undefined;
      const next = {
        ...p,
        foundations: p.foundations.map((f) => [...f]),
        tableau: p.tableau.map((c) => [...c]),
        waste: [...p.waste],
      };
      if (selected.from === "waste") {
        card = next.waste[next.waste.length - 1];
        if (!card || !canStackOnFoundation(card, next.foundations[fi])) return p;
        next.waste.pop();
      } else if (selected.from === "tableau" && selected.col !== undefined) {
        const col = next.tableau[selected.col];
        card = col[col.length - 1];
        if (!card || !canStackOnFoundation(card, next.foundations[fi])) return p;
        col.pop();
        if (col.length && !col[col.length - 1].faceUp) {
          col[col.length - 1] = { ...col[col.length - 1], faceUp: true };
        }
      } else return p;
      next.foundations[fi].push({ ...card, faceUp: true });
      setMoves((m) => m + 1);
      return next;
    });
    setSelected(null);
  };

  const tryMoveToTableau = (ti: number) => {
    if (!selected) {
      const col = piles.tableau[ti];
      const idx = col.map((c, i) => (c.faceUp ? i : -1)).filter((i) => i >= 0)[0];
      if (idx === undefined) return;
      setSelected({ from: "tableau", col: ti, index: idx });
      return;
    }

    setPiles((p) => {
      const next = {
        ...p,
        foundations: p.foundations.map((f) => [...f]),
        tableau: p.tableau.map((c) => [...c]),
        waste: [...p.waste],
      };
      const targetCol = next.tableau[ti];
      const target = targetCol[targetCol.length - 1];

      if (selected.from === "waste") {
        const card = next.waste[next.waste.length - 1];
        if (!card || !canStackOnTableau(card, target)) return p;
        next.waste.pop();
        targetCol.push(card);
      } else if (selected.from === "tableau" && selected.col !== undefined && selected.index !== undefined) {
        const src = next.tableau[selected.col];
        const moving = src.slice(selected.index);
        if (!moving.length || !canStackOnTableau(moving[0], target)) return p;
        next.tableau[selected.col] = src.slice(0, selected.index);
        const left = next.tableau[selected.col];
        if (left.length && !left[left.length - 1].faceUp) {
          left[left.length - 1] = { ...left[left.length - 1], faceUp: true };
        }
        targetCol.push(...moving);
      } else if (selected.from === "foundation" && selected.col !== undefined) {
        const f = next.foundations[selected.col];
        const card = f[f.length - 1];
        if (!card || !canStackOnTableau(card, target)) return p;
        f.pop();
        targetCol.push(card);
      } else return p;

      setMoves((m) => m + 1);
      return next;
    });
    setSelected(null);
  };

  const renderCard = (card: Card, selectedCard = false, z = 1) => (
    <PlayingCard
      key={card.id}
      card={card}
      faceUp={!!card.faceUp}
      selected={selectedCard}
      style={{ zIndex: z }}
    />
  );

  return (
    <div className="card-game">
      <div className="game-hud">
        <span>
          Score {Math.max(0, score)} · Coups {moves}
          {won ? " · Gagné !" : ""}
        </span>
        <button type="button" className="ghost-btn" onClick={reset}>
          Nouvelle donne
        </button>
      </div>

      <div className="solitaire-top">
        <button type="button" className="pile-btn" onClick={draw} aria-label="Piocher">
          {piles.stock.length ? (
            <PlayingCard card={{ ...piles.stock[0], faceUp: false, id: "stock" }} faceUp={false} />
          ) : (
            <PlayingCard empty emptyLabel="↺" />
          )}
        </button>
        <button type="button" className="pile-btn" onClick={selectWaste}>
          {piles.waste.length ? (
            <PlayingCard
              card={piles.waste[piles.waste.length - 1]}
              faceUp
              selected={selected?.from === "waste"}
            />
          ) : (
            <PlayingCard empty />
          )}
        </button>
        <div className="foundations">
          {piles.foundations.map((f, i) => (
            <button key={i} type="button" className="pile-btn" onClick={() => tryMoveToFoundation(i)}>
              {f.length ? (
                <PlayingCard card={f[f.length - 1]} faceUp />
              ) : (
                <PlayingCard empty emptyLabel="A" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="tableau">
        {piles.tableau.map((col, ci) => (
          <button key={ci} type="button" className="tableau-col" onClick={() => tryMoveToTableau(ci)}>
            {col.length === 0 && <PlayingCard empty />}
            {col.map((card, i) =>
              renderCard(
                card,
                selected?.from === "tableau" &&
                  selected.col === ci &&
                  selected.index !== undefined &&
                  i >= selected.index,
                i + 1,
              ),
            )}
          </button>
        ))}
      </div>
      <p className="hint">Clique déchet / colonne, puis une fondation ou une autre colonne.</p>
    </div>
  );
}
