import { isRed, suitGlyph, type Card, type Rank, type Suit } from "./cards";
import type { CSSProperties } from "react";

type Size = "sm" | "md" | "lg";

type Props = {
  card?: Card | null;
  faceUp?: boolean;
  empty?: boolean;
  emptyLabel?: string;
  selected?: boolean;
  size?: Size;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  as?: "div" | "button";
};

function centerMark(rank: Rank, suit: Suit): string {
  if (rank === "J" || rank === "Q" || rank === "K" || rank === "A") {
    return rank === "A" ? suitGlyph(suit) : rank;
  }
  return suitGlyph(suit);
}

function pipCount(rank: Rank): number {
  if (rank === "A") return 1;
  if (rank === "J" || rank === "Q" || rank === "K") return 0;
  return Number(rank);
}

/** Mini pip grid for 2–10 — column layouts stay inside the face. */
function Pips({ rank, suit }: { rank: Rank; suit: Suit }) {
  const n = pipCount(rank);
  if (n === 0) {
    return (
      <span className="pc-face-center court">{centerMark(rank, suit)}</span>
    );
  }
  if (n === 1) {
    return (
      <div className="pc-pips n1">
        <span className="pc-pip">{suitGlyph(suit)}</span>
      </div>
    );
  }

  const glyph = suitGlyph(suit);
  // Build left/right columns (classic French layout)
  // center column used for odd ranks
  let left = 0;
  let right = 0;
  let mid = 0;
  if (n === 2) {
    left = 1;
    right = 1;
  } else if (n === 3) {
    mid = 3;
  } else if (n === 4) {
    left = 2;
    right = 2;
  } else if (n === 5) {
    left = 2;
    right = 2;
    mid = 1;
  } else if (n === 6) {
    left = 3;
    right = 3;
  } else if (n === 7) {
    left = 3;
    right = 3;
    mid = 1;
  } else if (n === 8) {
    left = 4;
    right = 4;
  } else if (n === 9) {
    left = 4;
    right = 4;
    mid = 1;
  } else {
    // 10
    left = 5;
    right = 5;
  }

  const col = (count: number, key: string) => (
    <div key={key} className="pc-pip-col">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="pc-pip">
          {glyph}
        </span>
      ))}
    </div>
  );

  return (
    <div className={`pc-pips n${n}${mid ? " has-mid" : ""}`}>
      {left > 0 && col(left, "L")}
      {mid > 0 && col(mid, "M")}
      {right > 0 && col(right, "R")}
    </div>
  );
}

export function PlayingCard({
  card,
  faceUp,
  empty,
  emptyLabel,
  selected,
  size = "md",
  className = "",
  style,
  onClick,
  as = "div",
}: Props) {
  const Tag = as;
  const showFace = faceUp ?? card?.faceUp ?? false;
  const red = card ? isRed(card.suit) : false;
  const btnProps = as === "button" ? ({ type: "button" } as const) : {};

  if (empty || !card) {
    return (
      <Tag
        {...btnProps}
        className={`pc empty size-${size} ${className}`.trim()}
        style={style}
        onClick={onClick}
        aria-label={emptyLabel ?? "emplacement vide"}
      >
        {emptyLabel ? <span className="pc-empty-label">{emptyLabel}</span> : null}
      </Tag>
    );
  }

  return (
    <Tag
      {...btnProps}
      className={[
        "pc",
        showFace ? "face" : "back",
        red ? "red" : "black",
        selected ? "selected" : "",
        `size-${size}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      onClick={onClick}
      aria-label={
        showFace
          ? `${card.rank} ${suitGlyph(card.suit)}`
          : "carte face cachée"
      }
    >
      {showFace ? (
        <div className="pc-face">
          <div className="pc-corner tl">
            <span className="pc-rank">{card.rank}</span>
            <span className="pc-suit">{suitGlyph(card.suit)}</span>
          </div>
          <Pips rank={card.rank} suit={card.suit} />
          <div className="pc-corner br">
            <span className="pc-rank">{card.rank}</span>
            <span className="pc-suit">{suitGlyph(card.suit)}</span>
          </div>
        </div>
      ) : (
        <div className="pc-verso" aria-hidden>
          <div className="pc-verso-pattern" />
          <div className="pc-verso-gem" />
          <div className="pc-verso-badge">
            <span>RELAY</span>
          </div>
        </div>
      )}
    </Tag>
  );
}
