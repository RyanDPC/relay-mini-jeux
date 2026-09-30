import "./TouchPad.css";

type Dir = { x: number; y: number };

type Props = {
  mode: "dpad" | "lr";
  onDir: (dir: Dir) => void;
  onDirEnd?: () => void;
};

export function TouchPad({ mode, onDir, onDirEnd }: Props) {
  const press = (dir: Dir) => () => onDir(dir);
  const release = () => onDirEnd?.();

  if (mode === "lr") {
    return (
      <div className="touch-pad lr" aria-label="Contrôles tactiles">
        <button
          type="button"
          onPointerDown={press({ x: -1, y: 0 })}
          onPointerUp={release}
          onPointerLeave={release}
        >
          ←
        </button>
        <button
          type="button"
          onPointerDown={press({ x: 1, y: 0 })}
          onPointerUp={release}
          onPointerLeave={release}
        >
          →
        </button>
      </div>
    );
  }

  return (
    <div className="touch-pad dpad" aria-label="Contrôles tactiles">
      <button type="button" className="up" onPointerDown={press({ x: 0, y: -1 })}>
        ↑
      </button>
      <button type="button" className="left" onPointerDown={press({ x: -1, y: 0 })}>
        ←
      </button>
      <button type="button" className="right" onPointerDown={press({ x: 1, y: 0 })}>
        →
      </button>
      <button type="button" className="down" onPointerDown={press({ x: 0, y: 1 })}>
        ↓
      </button>
    </div>
  );
}
