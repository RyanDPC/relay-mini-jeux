import { useState } from "react";
import "./Cards.css";

type Role = "werewolf" | "seer" | "witch" | "villager";
type Seat = {
  id: string;
  name: string;
  isBot: boolean;
  role: Role;
  alive: boolean;
};

type Phase =
  | "lobby"
  | "night_wolves"
  | "night_seer"
  | "night_witch"
  | "day"
  | "vote"
  | "end";

type Props = {
  playerName: string;
  onScore: (score: number, final: boolean) => void;
};

function shuffle<T>(a: T[]): T[] {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ROLE_FR: Record<Role, string> = {
  werewolf: "Loup-garou",
  seer: "Voyante",
  witch: "Sorcière",
  villager: "Villageois",
};

export function WerewolfGame({ playerName, onScore }: Props) {
  const [phase, setPhase] = useState<Phase>("lobby");
  const [seats, setSeats] = useState<Seat[]>([]);
  const [night, setNight] = useState(1);
  const [log, setLog] = useState<string[]>([]);
  const [pendingKill, setPendingKill] = useState<string | null>(null);
  const [seerPeek, setSeerPeek] = useState<string | null>(null);
  const [witchHeal, setWitchHeal] = useState(true);
  const [witchPoison, setWitchPoison] = useState(true);
  const [showRole, setShowRole] = useState(false);
  const [votePick, setVotePick] = useState<string | null>(null);

  const me = seats.find((s) => s.id === "human");
  const alive = () => seats.filter((s) => s.alive);

  const push = (line: string) => setLog((l) => [line, ...l].slice(0, 50));

  const checkEnd = (next: Seat[]) => {
    const living = next.filter((s) => s.alive);
    const wolves = living.filter((s) => s.role === "werewolf").length;
    const village = living.length - wolves;
    if (wolves === 0) {
      setPhase("end");
      push("Le village gagne !");
      const humanWin = me?.role !== "werewolf";
      onScore(humanWin ? 900 : 120, true);
      return true;
    }
    if (wolves >= village) {
      setPhase("end");
      push("Les loups gagnent !");
      const humanWin = me?.role === "werewolf" && !!me.alive;
      onScore(humanWin ? 950 : 120, true);
      return true;
    }
    return false;
  };

  const start = () => {
    const roles: Role[] = [
      "werewolf",
      "werewolf",
      "seer",
      "witch",
      "villager",
      "villager",
      "villager",
      "villager",
    ];
    const names = [playerName, "Nyx", "Rex", "Kai", "Ivy", "Sol", "Ora", "Zen"];
    const assigned = shuffle(roles);
    const next = names.map((name, i) => ({
      id: i === 0 ? "human" : `bot${i}`,
      name,
      isBot: i !== 0,
      role: assigned[i],
      alive: true,
    }));
    setSeats(next);
    setNight(1);
    setWitchHeal(true);
    setWitchPoison(true);
    setPendingKill(null);
    setSeerPeek(null);
    setVotePick(null);
    setShowRole(false);
    setLog(["La nuit tombe sur le village…"]);
    onScore(0, false);
    beginNight(next, 1);
  };

  const beginNight = (current: Seat[], n: number) => {
    setNight(n);
    setPendingKill(null);
    setSeerPeek(null);
    push(`Nuit ${n}`);
    const living = current.filter((s) => s.alive);
    const humanWolf = living.find((s) => s.id === "human" && s.role === "werewolf");
    if (humanWolf) {
      setPhase("night_wolves");
      push("Loups : choisissez une victime.");
    } else {
      // bots choose
      const victims = living.filter((s) => s.role !== "werewolf");
      const pick = victims[Math.floor(Math.random() * victims.length)];
      setPendingKill(pick.id);
      continueAfterWolves(current, pick.id);
    }
  };

  const wolfKill = (id: string) => {
    if (phase !== "night_wolves") return;
    setPendingKill(id);
    continueAfterWolves(seats, id);
  };

  const continueAfterWolves = (current: Seat[], killId: string) => {
    const living = current.filter((s) => s.alive);
    const humanSeer = living.find((s) => s.id === "human" && s.role === "seer");
    if (humanSeer) {
      setPhase("night_seer");
      push("Voyante : inspectez quelqu’un.");
      setPendingKill(killId);
      return;
    }
    // bot seer
    if (living.some((s) => s.role === "seer")) {
      const target = living.filter((s) => s.role !== "seer")[
        Math.floor(Math.random() * Math.max(1, living.length - 1))
      ];
      if (target) setSeerPeek(`${target.name} → ${ROLE_FR[target.role]}`);
    }
    continueWitch(current, killId);
  };

  const seerLook = (id: string) => {
    if (phase !== "night_seer") return;
    const t = seats.find((s) => s.id === id)!;
    setSeerPeek(`${t.name} → ${ROLE_FR[t.role]}`);
    continueWitch(seats, pendingKill!);
  };

  const continueWitch = (current: Seat[], killId: string) => {
    const living = current.filter((s) => s.alive);
    const humanWitch = living.find((s) => s.id === "human" && s.role === "witch");
    if (humanWitch && (witchHeal || witchPoison)) {
      setPhase("night_witch");
      setPendingKill(killId);
      push(
        `Sorcière : victime prévue = ${current.find((s) => s.id === killId)?.name}. Potion ?`,
      );
      return;
    }
    resolveDawn(current, killId, false, null);
  };

  const witchAct = (heal: boolean, poisonId: string | null) => {
    if (phase !== "night_witch") return;
    let killId = pendingKill;
    if (heal && witchHeal && killId) {
      setWitchHeal(false);
      killId = null;
      push("La sorcière sauve la victime.");
    }
    if (poisonId && witchPoison) {
      setWitchPoison(false);
      push(`Poison sur ${seats.find((s) => s.id === poisonId)?.name}`);
    }
    resolveDawn(seats, killId, false, poisonId);
  };

  const resolveDawn = (
    current: Seat[],
    killId: string | null,
    _unused: boolean,
    poisonId: string | null,
  ) => {
    let next = current.map((s) => ({ ...s }));
    const deaths: string[] = [];
    if (killId) {
      next = next.map((s) => (s.id === killId ? { ...s, alive: false } : s));
      deaths.push(current.find((s) => s.id === killId)!.name);
    }
    if (poisonId) {
      next = next.map((s) => (s.id === poisonId ? { ...s, alive: false } : s));
      deaths.push(current.find((s) => s.id === poisonId)!.name);
    }
    setSeats(next);
    push(
      deaths.length
        ? `Le jour se lève. Morts : ${[...new Set(deaths)].join(", ")}`
        : "Le jour se lève. Personne n’est mort.",
    );
    if (checkEnd(next)) return;
    setPhase("day");
    setVotePick(null);
  };

  const goVote = () => {
    setPhase("vote");
    push("Le village vote pour éliminer un suspect.");
  };

  const castVote = (id: string) => {
    if (phase !== "vote") return;
    setVotePick(id);
    const living = alive().filter((s) => s.id !== id);
    // bots add noise votes — majority on human pick often
    const tally: Record<string, number> = { [id]: 1 };
    for (const bot of living.filter((s) => s.isBot)) {
      const pool = alive().filter((s) => s.id !== bot.id);
      const pick =
        Math.random() < 0.55
          ? seats.find((s) => s.id === id)!
          : pool[Math.floor(Math.random() * pool.length)];
      tally[pick.id] = (tally[pick.id] ?? 0) + 1;
    }
    let max = -1;
    let out = id;
    for (const [k, v] of Object.entries(tally)) {
      if (v > max) {
        max = v;
        out = k;
      }
    }
    const next = seats.map((s) => (s.id === out ? { ...s, alive: false } : s));
    const victim = seats.find((s) => s.id === out)!;
    setSeats(next);
    push(`${victim.name} est exécuté (${ROLE_FR[victim.role]}).`);
    if (checkEnd(next)) return;
    beginNight(next, night + 1);
  };

  const nightTargets = seats.filter((s) => s.alive && s.id !== "human");

  return (
    <div className="card-game social-table">
      <div className="game-hud">
        <span>
          Loup-garou · Nuit {night} · {phase}
        </span>
        <button type="button" className="ghost-btn" onClick={start}>
          {phase === "lobby" ? "Lancer (8 joueurs)" : "Nouvelle partie"}
        </button>
      </div>

      {phase === "lobby" && (
        <p className="hint">
          2 loups, 1 voyante, 1 sorcière, 4 villageois. Nuits secrètes, votes le jour.
          Bots remplissent la table (Party pour vrais amis bientôt branché sur le même
          moteur).
        </p>
      )}

      {me && phase !== "lobby" && (
        <div className="seat-chip active">
          Toi : {showRole ? ROLE_FR[me.role] : "rôle masqué"}
          {!me.alive ? " (mort)" : ""}
          <button
            type="button"
            className="ghost-btn"
            style={{ marginLeft: "0.5rem" }}
            onClick={() => setShowRole((v) => !v)}
          >
            {showRole ? "Masquer" : "Voir mon rôle"}
          </button>
        </div>
      )}

      {seerPeek && phase !== "lobby" && (
        <p className="hint">Vision : {seerPeek}</p>
      )}

      {phase !== "lobby" && (
        <div className="seat-rail">
          {seats.map((s) => {
            const selectable =
              (phase === "night_wolves" && me?.role === "werewolf" && s.alive && s.role !== "werewolf") ||
              (phase === "night_seer" && me?.role === "seer" && s.alive && s.id !== "human") ||
              (phase === "vote" && s.alive && s.id !== "human");
            return (
              <button
                key={s.id}
                type="button"
                className={`seat-chip ${!s.alive ? "bot" : ""} ${votePick === s.id || pendingKill === s.id ? "active" : ""}`}
                disabled={!selectable}
                onClick={() => {
                  if (phase === "night_wolves") wolfKill(s.id);
                  else if (phase === "night_seer") seerLook(s.id);
                  else if (phase === "vote") castVote(s.id);
                }}
              >
                {s.name}
                {!s.alive ? " ✕" : ""}
                {phase === "end" ? ` · ${ROLE_FR[s.role]}` : ""}
              </button>
            );
          })}
        </div>
      )}

      {phase === "night_witch" && (
        <div className="bj-actions">
          {witchHeal && pendingKill && (
            <button type="button" className="primary-btn" onClick={() => witchAct(true, null)}>
              Sauver {seats.find((s) => s.id === pendingKill)?.name}
            </button>
          )}
          {witchPoison &&
            nightTargets.map((s) => (
              <button
                key={s.id}
                type="button"
                className="ghost-btn"
                onClick={() => witchAct(false, s.id)}
              >
                Empoisonner {s.name}
              </button>
            ))}
          <button type="button" className="ghost-btn" onClick={() => witchAct(false, null)}>
            Ne rien faire
          </button>
        </div>
      )}

      {phase === "day" && (
        <button type="button" className="primary-btn" onClick={goVote}>
          Ouvrir le vote du village
        </button>
      )}

      <div className="log-box">
        {log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}
