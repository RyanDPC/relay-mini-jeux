import { useMemo, useState } from "react";
import "./Cards.css";

type Role = "civilian" | "undercover" | "mrwhite";
type Seat = {
  id: string;
  name: string;
  isBot: boolean;
  role: Role;
  word: string;
  alive: boolean;
  votes: number;
};

type Props = {
  playerName: string;
  onScore: (score: number, final: boolean) => void;
};

const PAIRS: [string, string][] = [
  ["café", "thé"],
  ["chat", "chien"],
  ["lune", "soleil"],
  ["train", "métro"],
  ["pizza", "burger"],
  ["neige", "pluie"],
  ["épée", "couteau"],
  ["piano", "guitare"],
  ["océan", "lac"],
  ["fantôme", "esprit"],
];

function shuffle<T>(a: T[]): T[] {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function UndercoverGame({ playerName, onScore }: Props) {
  const [phase, setPhase] = useState<"lobby" | "talk" | "vote" | "reveal">("lobby");
  const [seats, setSeats] = useState<Seat[]>([]);
  const [round, setRound] = useState(1);
  const [log, setLog] = useState<string[]>([]);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const me = seats.find((s) => s.id === "human");
  const alive = seats.filter((s) => s.alive);

  const start = () => {
    const [civWord, ucWord] = PAIRS[Math.floor(Math.random() * PAIRS.length)];
    const names = [playerName, "Nyx", "Rex", "Kai", "Ivy", "Sol"];
    const roles: Role[] = ["undercover", "mrwhite", "civilian", "civilian", "civilian", "civilian"];
    const assigned = shuffle(roles);
    const next: Seat[] = names.map((name, i) => {
      const role = assigned[i];
      const word =
        role === "civilian" ? civWord : role === "undercover" ? ucWord : "???";
      return {
        id: i === 0 ? "human" : `bot${i}`,
        name,
        isBot: i !== 0,
        role,
        word,
        alive: true,
        votes: 0,
      };
    });
    setSeats(next);
    setPhase("talk");
    setRound(1);
    setMyVote(null);
    setRevealed(false);
    setLog([
      "Chacun a un mot (sauf Mr White). Décrivez sans révéler trop.",
      `Manche ${1} — discussion.`,
    ]);
    onScore(0, false);
  };

  const botHints = useMemo(() => {
    if (phase !== "talk") return [] as string[];
    return seats
      .filter((s) => s.isBot && s.alive)
      .map((s) => {
        if (s.role === "mrwhite") {
          return `${s.name} : « quelque chose de quotidien… »`;
        }
        const soft = s.word.slice(0, Math.min(3, s.word.length)) + "…";
        return `${s.name} : « lié à ${soft} »`;
      });
  }, [phase, seats]);

  const goVote = () => {
    setPhase("vote");
    setMyVote(null);
    setLog((l) => [`Votez pour éliminer un suspect.`, ...l]);
  };

  const resolveVote = (humanTarget: string) => {
    const targets = alive.filter((s) => s.id !== "human");
    // bots pile on random (slight bias toward undercover/mrwhite for fun balance)
    const tally: Record<string, number> = {};
    for (const a of alive) tally[a.id] = 0;
    tally[humanTarget] = (tally[humanTarget] ?? 0) + 1;
    for (const bot of targets) {
      const pool = alive.filter((s) => s.id !== bot.id);
      const suspicious = pool.filter((s) => s.role !== "civilian");
      const pick =
        Math.random() < 0.45 && suspicious.length
          ? suspicious[Math.floor(Math.random() * suspicious.length)]
          : pool[Math.floor(Math.random() * pool.length)];
      tally[pick.id] = (tally[pick.id] ?? 0) + 1;
    }
    let max = -1;
    let eliminatedId = humanTarget;
    for (const [id, n] of Object.entries(tally)) {
      if (n > max) {
        max = n;
        eliminatedId = id;
      }
    }
    const eliminated = seats.find((s) => s.id === eliminatedId)!;
    const next = seats.map((s) =>
      s.id === eliminatedId ? { ...s, alive: false } : s,
    );
    setSeats(next);
    setLog((l) => [
      `${eliminated.name} est éliminé — rôle : ${eliminated.role}`,
      ...l,
    ]);

    const still = next.filter((s) => s.alive);
    const ucAlive = still.some((s) => s.role === "undercover");
    const whiteAlive = still.some((s) => s.role === "mrwhite");
    const civAlive = still.filter((s) => s.role === "civilian").length;

    if (!ucAlive && !whiteAlive) {
      setPhase("reveal");
      setLog((l) => ["Civils gagnent !", ...l]);
      onScore(me?.alive ? 800 : 200, true);
      return;
    }
    if (civAlive <= 1 && (ucAlive || whiteAlive)) {
      setPhase("reveal");
      setLog((l) => ["Undercover / Mr White gagnent !", ...l]);
      const win =
        me &&
        me.alive &&
        (me.role === "undercover" || me.role === "mrwhite");
      onScore(win ? 900 : 150, true);
      return;
    }

    setRound((r) => r + 1);
    setPhase("talk");
    setMyVote(null);
  };

  const castVote = (id: string) => {
    if (phase !== "vote" || myVote) return;
    setMyVote(id);
    resolveVote(id);
  };

  return (
    <div className="card-game social-table">
      <div className="game-hud">
        <span>
          Undercover · Manche {round}
          {phase === "reveal" ? " · Fin" : ""}
        </span>
        <button type="button" className="ghost-btn" onClick={start}>
          {phase === "lobby" ? "Lancer (6 joueurs)" : "Nouvelle partie"}
        </button>
      </div>

      {phase === "lobby" && (
        <p className="hint">
          1 Undercover, 1 Mr White, 4 civils. Même mot pour les civils, mot proche pour
          l’undercover, rien pour Mr White.
        </p>
      )}

      {me && phase !== "lobby" && (
        <div className="seat-chip active">
          Ton rôle : {revealed || phase === "reveal" ? me.role : "secret"} · Mot :{" "}
          <strong>{me.word}</strong>
          <button
            type="button"
            className="ghost-btn"
            style={{ marginLeft: "0.6rem" }}
            onClick={() => setRevealed((v) => !v)}
          >
            {revealed ? "Masquer rôle" : "Voir rôle"}
          </button>
        </div>
      )}

      {phase !== "lobby" && (
        <div className="seat-rail">
          {seats.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`seat-chip ${!s.alive ? "bot" : ""} ${myVote === s.id ? "active" : ""}`}
              disabled={phase !== "vote" || !s.alive || s.id === "human" || !!myVote}
              onClick={() => castVote(s.id)}
            >
              {s.name}
              {!s.alive ? " ✕" : ""}
              {phase === "reveal" ? ` (${s.role})` : ""}
            </button>
          ))}
        </div>
      )}

      {phase === "talk" && (
        <>
          <div className="log-box">
            {botHints.map((h) => (
              <div key={h}>{h}</div>
            ))}
            <div>Toi : décris ton mot à voix haute (ou dans le chat Party).</div>
          </div>
          <button type="button" className="primary-btn" onClick={goVote}>
            Passer au vote
          </button>
        </>
      )}

      {phase === "vote" && <p className="hint">Clique un joueur pour voter.</p>}

      <div className="log-box">
        {log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}
