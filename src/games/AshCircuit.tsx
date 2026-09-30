import { useEffect, useRef, useState } from "react";
import { TouchPad } from "../components/TouchPad";
import { createAshState, stepAsh, type AshInput, type AshState } from "./ashCircuitLogic";
import { useCanvasFit } from "./useCanvasFit";

type Props = { onScore: (score: number, final: boolean) => void };

export function AshCircuit({ onScore }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<AshState>(createAshState());
  const inputRef = useRef<AshInput>({
    steer: 0,
    drift: false,
    boost: false,
    hack: false,
  });
  const keysRef = useRef<Record<string, boolean>>({});
  const [hud, setHud] = useState({
    score: 0,
    speed: 0,
    boost: 1,
    combo: 0,
    seg: "straight",
    msg: "",
    alive: true,
    bossHp: 0,
    bossMax: 0,
  });
  const [running, setRunning] = useState(false);
  useCanvasFit(canvasRef, 16 / 9);

  const reset = () => {
    stateRef.current = createAshState();
    setRunning(true);
    onScore(0, false);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const k = keysRef.current;
      let steer = 0;
      if (k.KeyA || k.ArrowLeft) steer -= 1;
      if (k.KeyD || k.ArrowRight) steer += 1;
      if (inputRef.current.steer !== 0 && steer === 0) {
        // keep touch steer
        steer = inputRef.current.steer;
      } else {
        inputRef.current.steer = steer;
      }
      inputRef.current.drift = !!(k.ShiftLeft || k.ShiftRight);
      inputRef.current.boost = !!k.Space;
      inputRef.current.hack = !!(k.KeyF || k.KeyE);

      const prevAlive = stateRef.current.alive;
      stateRef.current = stepAsh(stateRef.current, dt, inputRef.current);
      const s = stateRef.current;

      setHud({
        score: Math.floor(s.score),
        speed: s.speed,
        boost: s.boostFuel,
        combo: Math.floor(s.combo),
        seg: s.segmentKind,
        msg: s.message,
        alive: s.alive,
        bossHp: s.boss.active ? s.boss.hp : 0,
        bossMax: s.boss.maxHp,
      });
      onScore(Math.floor(s.score), false);

      // draw minimal
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        const w = canvas.width;
        const h = canvas.height;
        ctx.fillStyle = "#071210";
        ctx.fillRect(0, 0, w, h);
        // road trapezoid
        ctx.fillStyle = "#1a2a26";
        ctx.beginPath();
        ctx.moveTo(w * 0.2, h);
        ctx.lineTo(w * 0.8, h);
        ctx.lineTo(w * 0.55, h * 0.15);
        ctx.lineTo(w * 0.45, h * 0.15);
        ctx.closePath();
        ctx.fill();
        // lane marker by player
        const px = w * 0.5 + s.lane * w * 0.22;
        ctx.fillStyle = "#3dcf9a";
        ctx.fillRect(px - 10, h * 0.72, 20, 28);
        // obstacles as bars
        for (const o of s.obstacles) {
          const depth = 1 - Math.min(1, o.z / 60);
          const oy = h * 0.15 + depth * h * 0.7;
          const ox = w * 0.5 + o.lane * (0.08 + depth * 0.22) * w;
          const ow = (12 + o.w * 40) * depth;
          ctx.fillStyle =
            o.kind === "mine" ? "#f2c14e" : o.kind === "drone" ? "#6ec8ff" : "#ff6b6b";
          ctx.fillRect(ox - ow / 2, oy, ow, 6 + depth * 8);
        }
        for (const p of s.ports) {
          if (p.hacked) continue;
          const depth = 1 - Math.min(1, p.z / 60);
          const oy = h * 0.15 + depth * h * 0.7;
          const ox = w * 0.5 + p.lane * (0.08 + depth * 0.22) * w;
          ctx.strokeStyle = p.window > 0 ? "#c9a0ff" : "#888";
          ctx.strokeRect(ox - 8, oy - 8, 16, 16);
        }
        if (s.boss.active) {
          ctx.fillStyle = "#ff6b6b";
          ctx.fillRect(w * 0.35, h * 0.08, w * 0.3 * (s.boss.hp / s.boss.maxHp), 8);
          if (s.boss.telegraph > 0) {
            const lx = w * 0.5 + s.boss.attackLane * w * 0.18;
            ctx.fillStyle = "rgba(255,80,80,0.35)";
            ctx.fillRect(lx - 20, h * 0.2, 40, h * 0.55);
          }
        }
      }

      if (!s.alive && prevAlive) {
        onScore(Math.floor(s.score), true);
        setRunning(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, onScore]);

  return (
    <div className="card-game">
      <div className="game-hud">
        <span>
          {Math.floor(hud.score)} · spd {hud.speed.toFixed(0)} · boost{" "}
          {(hud.boost * 100).toFixed(0)}% · combo {hud.combo} · {hud.seg}
        </span>
        <button type="button" className="ghost-btn" onClick={reset}>
          {running ? "Reset" : "Go"}
        </button>
      </div>
      {hud.bossMax > 0 && (
        <p className="hint">
          Boss HP {Math.max(0, hud.bossHp).toFixed(0)}/{hud.bossMax}
        </p>
      )}
      <div className="canvas-slot">
        <canvas ref={canvasRef} className="game-canvas" width={960} height={540} />
      </div>
      <p className="hint">{hud.msg}</p>
      <div className="bj-actions">
        <TouchPad
          mode="lr"
          onDir={(d) => {
            inputRef.current.steer = d.x;
          }}
          onDirEnd={() => {
            inputRef.current.steer = 0;
          }}
        />
        <button
          type="button"
          className="ghost-btn"
          onPointerDown={() => {
            inputRef.current.drift = true;
          }}
          onPointerUp={() => {
            inputRef.current.drift = false;
          }}
        >
          Drift
        </button>
        <button
          type="button"
          className="ghost-btn"
          onPointerDown={() => {
            inputRef.current.boost = true;
          }}
          onPointerUp={() => {
            inputRef.current.boost = false;
          }}
        >
          Boost
        </button>
        <button
          type="button"
          className="primary-btn"
          onPointerDown={() => {
            inputRef.current.hack = true;
          }}
          onPointerUp={() => {
            inputRef.current.hack = false;
          }}
        >
          Hack
        </button>
      </div>
      {!hud.alive && <p className="hint">Fin — score {hud.score}</p>}
    </div>
  );
}
