import { freshDeck, type Card, type Rank, type Suit } from "./cards";
import { PlayingCard } from "./PlayingCard";
import "./Cards.css";

const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS: Suit[] = ["S", "H", "D", "C"];
const SUIT_NAME: Record<Suit, string> = {
  S: "Pique",
  H: "Cœur",
  D: "Carreau",
  C: "Trèfle",
};

function makeCard(suit: Suit, rank: Rank): Card {
  return {
    id: `${suit}-${rank}`,
    suit,
    rank,
    faceUp: true,
  };
}

/** Full-deck visual QA board (faces + verso). */
export function CardLab() {
  const backs = freshDeck(false).slice(0, 4);

  return (
    <div className="card-game card-lab">
      <div className="game-hud">
        <span>Lab cartes — 52 faces + verso</span>
      </div>

      <div className="card-lab-back-row">
        <span className="card-lab-label">Verso</span>
        {backs.map((c) => (
          <PlayingCard key={c.id} card={c} faceUp={false} size="lg" />
        ))}
        <PlayingCard empty emptyLabel="A" size="lg" />
      </div>

      {SUITS.map((suit) => (
        <div key={suit} className="card-lab-suit">
          <span className="card-lab-label">
            {SUIT_NAME[suit]} {suit === "H" || suit === "D" ? "rouge" : "noir"}
          </span>
          <div className="card-lab-row">
            {RANKS.map((rank) => (
              <PlayingCard
                key={`${suit}-${rank}`}
                card={makeCard(suit, rank)}
                faceUp
                size="lg"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
