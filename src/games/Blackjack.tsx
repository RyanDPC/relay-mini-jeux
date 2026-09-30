import { useState } from "react";
import { blackjackValue, freshDeck, shuffle, type Card } from "./cards";
import { PlayingCard } from "./PlayingCard";
import "./Cards.css";

type Props = { onScore: (score: number, final: boolean) => void };

export function Blackjack({ onScore }: Props) {
  const [deck, setDeck] = useState<Card[]>(() => shuffle(freshDeck(true)));
  const [player, setPlayer] = useState<Card[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [bank, setBank] = useState(500);
  const [bet, setBet] = useState(25);
  const [phase, setPhase] = useState<"bet" | "play" | "done">("bet");
  const [msg, setMsg] = useState("Place ta mise.");
  const [hideHole, setHideHole] = useState(true);

  const dealFrom = (source: Card[], n: number) => {
    const d = [...source];
    const cards: Card[] = [];
    for (let i = 0; i < n; i++) cards.push(d.pop()!);
    return { cards, deck: d };
  };

  const start = () => {
    if (bet > bank || bet < 5) return;
    let d = deck.length < 20 ? shuffle(freshDeck(true)) : [...deck];
    const p = dealFrom(d, 2);
    d = p.deck;
    const deal = dealFrom(d, 2);
    setDeck(deal.deck);
    setPlayer(p.cards);
    setDealer(deal.cards);
    setHideHole(true);
    setPhase("play");
    setBank((b) => b - bet);
    setMsg("Tire ou reste.");
    onScore(bank - bet, false);
    const pv = blackjackValue(p.cards);
    if (pv === 21) {
      finish(p.cards, deal.cards, deal.deck, true);
    }
  };

  const hit = () => {
    if (phase !== "play") return;
    const { cards, deck: d } = dealFrom(deck, 1);
    const next = [...player, ...cards];
    setPlayer(next);
    setDeck(d);
    if (blackjackValue(next) > 21) {
      setHideHole(false);
      setPhase("done");
      setMsg("Bust. Croupier gagne.");
      onScore(bank, true);
    }
  };

  const finish = (
    pHand: Card[],
    dHand: Card[],
    dDeck: Card[],
    autoBj = false,
  ) => {
    let dealerHand = [...dHand];
    let remaining = [...dDeck];
    setHideHole(false);
    while (blackjackValue(dealerHand) < 17) {
      const draw = dealFrom(remaining, 1);
      dealerHand = [...dealerHand, ...draw.cards];
      remaining = draw.deck;
    }
    setDealer(dealerHand);
    setDeck(remaining);
    const pv = blackjackValue(pHand);
    const dv = blackjackValue(dealerHand);
    let nextBank = bank;
    let text = "";
    if (autoBj && pv === 21) {
      const win = Math.floor(bet * 2.5);
      nextBank += win;
      text = `Blackjack ! +${win}`;
    } else if (pv > 21) {
      text = "Bust.";
    } else if (dv > 21 || pv > dv) {
      nextBank += bet * 2;
      text = `Tu gagnes +${bet * 2}`;
    } else if (pv === dv) {
      nextBank += bet;
      text = "Egalité — mise rendue.";
    } else {
      text = "Croupier gagne.";
    }
    setBank(nextBank);
    setMsg(text);
    setPhase("done");
    onScore(nextBank, true);
  };

  const stand = () => {
    if (phase !== "play") return;
    finish(player, dealer, deck);
  };

  return (
    <div className="card-game blackjack">
      <div className="game-hud">
        <span>
          Banque {bank} · Mise {bet}
        </span>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => {
            setBank(500);
            setPhase("bet");
            setPlayer([]);
            setDealer([]);
            setMsg("Place ta mise.");
            onScore(500, false);
          }}
        >
          Reset banque
        </button>
      </div>

      <div className="bj-table">
        <div>
          <p className="label">
            Croupier {hideHole ? "" : `(${blackjackValue(dealer)})`}
          </p>
          <div className="hand">
            {dealer.map((c, i) => (
              <PlayingCard
                key={c.id + (hideHole && i === 1 ? "h" : "")}
                card={c}
                faceUp={!(hideHole && i === 1)}
                size="lg"
              />
            ))}
            {dealer.length === 0 && <PlayingCard empty size="lg" />}
          </div>
        </div>
        <div>
          <p className="label">
            Toi {player.length ? `(${blackjackValue(player)})` : ""}
          </p>
          <div className="hand">
            {player.map((c) => (
              <PlayingCard key={c.id} card={c} faceUp size="lg" />
            ))}
            {player.length === 0 && <PlayingCard empty size="lg" />}
          </div>
        </div>
      </div>

      <p className="hint">{msg}</p>

      {phase === "bet" && (
        <div className="bj-actions">
          <input
            type="range"
            min={5}
            max={Math.max(5, bank)}
            step={5}
            value={Math.min(bet, bank)}
            onChange={(e) => setBet(Number(e.target.value))}
          />
          <button
            type="button"
            className="primary-btn"
            onClick={start}
            disabled={bank < 5}
          >
            Distribuer
          </button>
        </div>
      )}
      {phase === "play" && (
        <div className="bj-actions">
          <button type="button" className="primary-btn" onClick={hit}>
            Tirer
          </button>
          <button type="button" className="ghost-btn" onClick={stand}>
            Rester
          </button>
        </div>
      )}
      {phase === "done" && (
        <button
          type="button"
          className="primary-btn"
          onClick={() => setPhase("bet")}
        >
          Nouvelle main
        </button>
      )}
    </div>
  );
}
