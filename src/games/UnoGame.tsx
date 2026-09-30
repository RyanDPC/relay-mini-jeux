import { useEffect, useMemo, useState } from "react";
import { UnoCardView, type UnoColor, type UnoCardData } from "./UnoCardView";
import "./Cards.css";

type UnoCard = UnoCardData;

type Player = {
  id: string;
  name: string;
  isBot: boolean;
  hand: UnoCard[];
};

type Props = {
  playerName: string;
  onScore: (score: number, final: boolean) => void;
};

const COLORS: UnoColor[] = ["R", "G", "B", "Y"];
const colorLabel: Record<UnoColor, string> = {
  R: "#e74c3c",
  G: "#27ae60",
  B: "#3498db",
  Y: "#f1c40f",
  W: "#ecf0f1",
};

function makeDeck(): UnoCard[] {
  const deck: UnoCard[] = [];
  let n = 0;
  for (const color of COLORS) {
    deck.push({ id: `c${n++}`, color, value: "0" });
    for (let r = 1; r <= 9; r++) {
      deck.push({ id: `c${n++}`, color, value: String(r) });
      deck.push({ id: `c${n++}`, color, value: String(r) });
    }
    for (const v of ["skip", "reverse", "+2"]) {
      deck.push({ id: `c${n++}`, color, value: v });
      deck.push({ id: `c${n++}`, color, value: v });
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `c${n++}`, color: "W", value: "wild" });
    deck.push({ id: `c${n++}`, color: "W", value: "+4" });
  }
  return deck;
}

function shuffle<T>(a: T[]): T[] {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function canPlay(card: UnoCard, top: UnoCard, activeColor: UnoColor): boolean {
  if (card.color === "W") return true;
  if (card.color === activeColor) return true;
  return card.value === top.value;
}

export function UnoGame({ playerName, onScore }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [pile, setPile] = useState<UnoCard[]>([]);
  const [stock, setStock] = useState<UnoCard[]>([]);
  const [turn, setTurn] = useState(0);
  const [dir, setDir] = useState(1);
  const [activeColor, setActiveColor] = useState<UnoColor>("R");
  const [log, setLog] = useState<string[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [pickColor, setPickColor] = useState<UnoCard | null>(null);

  const human = players[0];
  const top = pile[pile.length - 1];

  const pushLog = (line: string) => setLog((l) => [line, ...l].slice(0, 40));

  const boot = () => {
    let deck = shuffle(makeDeck());
    const deal = (count: number) => {
      const hand = deck.slice(0, count);
      deck = deck.slice(count);
      return hand;
    };
    const seats: Player[] = [
      { id: "human", name: playerName, isBot: false, hand: deal(7) },
      { id: "bot1", name: "Bot-Nyx", isBot: true, hand: deal(7) },
      { id: "bot2", name: "Bot-Rex", isBot: true, hand: deal(7) },
      { id: "bot3", name: "Bot-Kai", isBot: true, hand: deal(7) },
    ];
    let start = deck[0];
    while (start.color === "W") {
      deck = shuffle(deck);
      start = deck[0];
    }
    deck = deck.slice(1);
    setPlayers(seats);
    setPile([start]);
    setStock(deck);
    setActiveColor(start.color);
    setTurn(0);
    setDir(1);
    setWinner(null);
    setPickColor(null);
    setLog([`Top : ${start.color} ${start.value}`]);
    onScore(0, false);
  };

  useEffect(() => {
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drawOne = (ps: Player[], st: UnoCard[], pid: number) => {
    let stockPile = [...st];
    let discard = [...pile];
    if (stockPile.length === 0) {
      const topCard = discard.pop()!;
      stockPile = shuffle(discard);
      discard = [topCard];
      setPile(discard);
    }
    const card = stockPile.pop();
    if (!card) return { players: ps, stock: stockPile };
    const next = ps.map((p, i) =>
      i === pid ? { ...p, hand: [...p.hand, card] } : p,
    );
    return { players: next, stock: stockPile };
  };

  const advance = (from: number, steps = 1, directionDir = dir) => {
    const n = players.length || 4;
    let t = from;
    for (let i = 0; i < steps; i++) {
      t = (t + directionDir + n) % n;
    }
    return t;
  };

  const applyCard = (
    ps: Player[],
    pid: number,
    card: UnoCard,
    chosenColor?: UnoColor,
  ) => {
    const nextPlayers = ps.map((p, i) =>
      i === pid ? { ...p, hand: p.hand.filter((c) => c.id !== card.id) } : p,
    );
    const nextPile = [...pile, card];
    let nextDir = dir;
    let nextTurn = pid;
    let color: UnoColor = card.color === "W" ? chosenColor ?? "R" : card.color;
    let st = stock;

    pushLog(`${ps[pid].name} joue ${card.color} ${card.value}`);

    if (nextPlayers[pid].hand.length === 0) {
      setPlayers(nextPlayers);
      setPile(nextPile);
      setActiveColor(color);
      setWinner(ps[pid].name);
      onScore(pid === 0 ? 1000 : 100, true);
      return;
    }

    if (card.value === "reverse") {
      nextDir = -dir;
      nextTurn = advance(pid, 1, nextDir);
    } else if (card.value === "skip") {
      nextTurn = advance(pid, 2, nextDir);
    } else if (card.value === "+2") {
      const victim = advance(pid, 1, nextDir);
      let drawn = { players: nextPlayers, stock: st };
      drawn = drawOne(drawn.players, drawn.stock, victim);
      drawn = drawOne(drawn.players, drawn.stock, victim);
      setPlayers(drawn.players);
      setStock(drawn.stock);
      setPile(nextPile);
      setDir(nextDir);
      setActiveColor(color);
      setTurn(advance(pid, 2, nextDir));
      return;
    } else if (card.value === "+4") {
      const victim = advance(pid, 1, nextDir);
      let drawn = { players: nextPlayers, stock: st };
      for (let i = 0; i < 4; i++) drawn = drawOne(drawn.players, drawn.stock, victim);
      setPlayers(drawn.players);
      setStock(drawn.stock);
      setPile(nextPile);
      setDir(nextDir);
      setActiveColor(color);
      setTurn(advance(pid, 2, nextDir));
      return;
    } else {
      nextTurn = advance(pid, 1, nextDir);
    }

    setPlayers(nextPlayers);
    setPile(nextPile);
    setDir(nextDir);
    setActiveColor(color);
    setTurn(nextTurn);
  };

  const humanPlay = (card: UnoCard) => {
    if (winner || turn !== 0 || !top) return;
    if (!canPlay(card, top, activeColor)) return;
    if (card.color === "W") {
      setPickColor(card);
      return;
    }
    applyCard(players, 0, card);
  };

  const confirmWild = (c: UnoColor) => {
    if (!pickColor) return;
    applyCard(players, 0, pickColor, c);
    setPickColor(null);
  };

  const humanDraw = () => {
    if (winner || turn !== 0) return;
    const drawn = drawOne(players, stock, 0);
    setPlayers(drawn.players);
    setStock(drawn.stock);
    pushLog(`${playerName} pioche`);
    setTurn(advance(0, 1));
  };

  // Bots
  useEffect(() => {
    if (winner || players.length === 0) return;
    const p = players[turn];
    if (!p?.isBot || !top) return;
    const t = window.setTimeout(() => {
      const playable = p.hand.filter((c) => canPlay(c, top, activeColor));
      if (playable.length === 0) {
        const drawn = drawOne(players, stock, turn);
        setPlayers(drawn.players);
        setStock(drawn.stock);
        pushLog(`${p.name} pioche`);
        setTurn(advance(turn, 1));
        return;
      }
      const card = playable[Math.floor(Math.random() * playable.length)];
      const wildColor = COLORS[Math.floor(Math.random() * 4)];
      applyCard(players, turn, card, wildColor);
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, players, winner]);

  const seats = useMemo(() => players, [players]);

  return (
    <div className="card-game social-table">
      <div className="game-hud">
        <span>
          Couleur {activeColor} · Sens {dir > 0 ? "→" : "←"}
          {winner ? ` · Gagnant : ${winner}` : ""}
        </span>
        <button type="button" className="ghost-btn" onClick={boot}>
          Relancer
        </button>
      </div>

      <div className="seat-rail">
        {seats.map((p, i) => (
          <div
            key={p.id}
            className={`seat-chip ${i === turn ? "active" : ""} ${p.isBot ? "bot" : ""}`}
          >
            {p.name} · {p.hand.length}
          </div>
        ))}
      </div>

      <div className="uno-discard">
        <UnoCardView
          card={{ id: "stock", color: "W", value: "wild" }}
          faceUp={false}
          size="lg"
          disabled
        />
        {top && <UnoCardView card={top} faceUp size="lg" disabled />}
        <span
          className="seat-chip active"
          title="Couleur active"
          style={{
            background: colorLabel[activeColor],
            color: activeColor === "Y" || activeColor === "W" ? "#111" : "#fff",
            borderColor: "transparent",
          }}
        >
          {activeColor}
        </span>
      </div>

      {/* bot hands — compact under seats, not a second board */}
      <div className="uno-bot-backs">
        {seats
          .filter((p) => p.isBot)
          .map((p) => (
            <div key={p.id} className="uno-bot-row" title={p.name}>
              <span className="uno-bot-name">{p.name}</span>
              {Array.from({ length: Math.min(p.hand.length, 5) }, (_, i) => (
                <UnoCardView
                  key={`${p.id}-b${i}`}
                  card={p.hand[i]}
                  faceUp={false}
                  size="sm"
                  disabled
                />
              ))}
              {p.hand.length > 5 && (
                <span className="hint">+{p.hand.length - 5}</span>
              )}
            </div>
          ))}
      </div>

      {human && (
        <div className="uno-hand is-player">
          {human.hand.map((c) => (
            <UnoCardView
              key={c.id}
              card={c}
              faceUp
              size="lg"
              onClick={() => humanPlay(c)}
              disabled={turn !== 0 || !!winner}
            />
          ))}
        </div>
      )}

      <div className="bj-actions">
        <button type="button" className="ghost-btn" onClick={humanDraw} disabled={turn !== 0 || !!winner}>
          Piocher
        </button>
      </div>

      {pickColor && (
        <div className="bj-actions">
          <span className="hint">Choisis une couleur</span>
          {COLORS.map((c) => (
            <button key={c} type="button" className="primary-btn" style={{ background: colorLabel[c], color: "#111" }} onClick={() => confirmWild(c)}>
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="log-box">
        {log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}
