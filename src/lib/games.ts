import type { GameMeta } from "./types";

export const GAMES: GameMeta[] = [
  {
    id: "ash-circuit",
    title: "Ash Circuit",
    genre: "Runner · Solo",
    blurb: "2.5D cyber run — drift, boost, ports à hacker, boss procédural.",
    accent: "#3dcf9a",
    mode: "solo",
    featured: true,
  },
  {
    id: "split-voltage",
    title: "Split Voltage",
    genre: "Duel · 1v1",
    blurb: "Arena live — dash, parry, zones électrifiées (bot pour l’instant).",
    accent: "#6ec8ff",
    mode: "solo",
    featured: true,
  },
  {
    id: "cemantik",
    title: "Cemantik",
    genre: "Mots · Solo / Multi",
    blurb: "Proximité sémantique — Facile, Dur, Mondial (multi) ou Mystère (rang seul).",
    accent: "#f2c14e",
    mode: "solo",
    featured: true,
  },
  {
    id: "solitaire",
    title: "Solitaire",
    genre: "Cartes · Solo",
    blurb: "Klondike classique. Monte les fondations As → Roi.",
    accent: "#3dcf9a",
    mode: "solo",
    featured: true,
  },
  {
    id: "blackjack",
    title: "Blackjack",
    genre: "Cartes · Solo",
    blurb: "21 contre le croupier. Mise, tire, reste.",
    accent: "#f2c14e",
    mode: "solo",
    featured: true,
  },
  {
    id: "uno",
    title: "UNO",
    genre: "Cartes · Multi",
    blurb: "Couleurs, +2, sens inverse. Bots ou amis en live.",
    accent: "#ff6b6b",
    mode: "social",
    featured: true,
  },
  {
    id: "undercover",
    title: "Undercover",
    genre: "Social · Multi",
    blurb: "Mots proches, traque l’imposteur. Votes à chaque round.",
    accent: "#c9a0ff",
    mode: "social",
    featured: true,
  },
  {
    id: "werewolf",
    title: "Loup-garou",
    genre: "Social · Multi",
    blurb: "Nuits, jours, seigneurie du village. Rôles & votes.",
    accent: "#6ec8ff",
    mode: "social",
    featured: true,
  },
  {
    id: "card-lab",
    title: "Card Lab",
    genre: "QA · Cartes",
    blurb: "Plateau de contrôle des 52 faces + verso.",
    accent: "#8aa39a",
    mode: "solo",
  },
  {
    id: "pulse-snake",
    title: "Pulse Snake",
    genre: "Arcade",
    blurb: "Serpent rythmé. Collecte les impulsions.",
    accent: "#8aa39a",
    mode: "solo",
  },
  {
    id: "echo-memory",
    title: "Echo Memory",
    genre: "Puzzle",
    blurb: "Retrouve les paires avant l’écho.",
    accent: "#8aa39a",
    mode: "solo",
  },
  {
    id: "drift-breaker",
    title: "Drift Breaker",
    genre: "Action",
    blurb: "Casse les blocs en dérive.",
    accent: "#8aa39a",
    mode: "solo",
  },
];

export function getGame(id: string): GameMeta | undefined {
  return GAMES.find((g) => g.id === id);
}

export function featuredGames(): GameMeta[] {
  return GAMES.filter((g) => g.featured);
}
