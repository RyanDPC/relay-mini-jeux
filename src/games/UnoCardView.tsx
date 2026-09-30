export type UnoColor = "R" | "G" | "B" | "Y" | "W";

export type UnoCardData = {
  id: string;
  color: UnoColor;
  value: string;
};

type Size = "sm" | "md" | "lg";

type Props = {
  card?: UnoCardData | null;
  faceUp?: boolean;
  empty?: boolean;
  selected?: boolean;
  size?: Size;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
};

const VALUE_LABEL: Record<string, string> = {
  skip: "⊘",
  reverse: "⇄",
  "+2": "+2",
  "+4": "+4",
  wild: "★",
};

export function UnoCardView({
  card,
  faceUp = true,
  empty,
  selected,
  size = "md",
  className = "",
  onClick,
  disabled,
}: Props) {
  if (empty || !card) {
    return (
      <div className={`uc empty size-${size} ${className}`.trim()} aria-hidden />
    );
  }

  const label = VALUE_LABEL[card.value] ?? card.value;
  const colorClass =
    card.color === "W" ? "wild" : `c-${card.color.toLowerCase()}`;

  if (!faceUp) {
    return (
      <button
        type="button"
        className={`uc back size-${size} ${selected ? "selected" : ""} ${className}`.trim()}
        onClick={onClick}
        disabled={disabled}
        aria-label="carte UNO face cachée"
      >
        <div className="uc-verso">
          <div className="uc-verso-band" />
          <span className="uc-verso-mark">UNO</span>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`uc face ${colorClass} size-${size} ${selected ? "selected" : ""} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      aria-label={`${card.color} ${card.value}`}
    >
      <div className="uc-face">
        <span className="uc-corner tl">{label}</span>
        {card.color === "W" ? (
          <>
            <div className="uc-wild-quarters" aria-hidden />
            <div className="uc-oval wild-oval">
              <span className="uc-value">{label}</span>
            </div>
          </>
        ) : (
          <div className="uc-oval">
            <span className="uc-value">{label}</span>
          </div>
        )}
        <span className="uc-corner br">{label}</span>
      </div>
    </button>
  );
}
