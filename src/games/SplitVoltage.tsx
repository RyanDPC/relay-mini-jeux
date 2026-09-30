import { useEffect, useRef, useState } from "react";
import { TouchPad } from "../components/TouchPad";
import {
  botInput,
  createSVState,
  scoreFromSV,
  stepSV,
  type SVInput,
  type SVState,
} from "./splitVoltageLogic";
import { useCanvasFit } from "./useCanvasFit";

type Props = { onScore: (score: number, final: boolean) => void };

export function SplitVoltage({ onScore }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SVState>(createSVState());
  const inputRef = useRef<SVInput>({
    moveX: 0,
    moveY: 0,
    dash: false,
    parry: false,
    strike: false,
  });
  const keysRef = useRef<Record<string, boolean>>({});
  const [hud, setHud] = useState({
    hp: 100,
    eHp: 100,
    energy: 1,
    msg: "",
    score: 0,
    over: false,
  });
  const [running, setRunning] = useState(false);
  useCanvasFit(canvasRef, 1);

  const reset = () => {
    stateRef.current = createSVState();
    setRunning(true);
    onScore(0, false);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (["Space", "KeyJ", "KeyF", "ShiftLeft", "ShiftRight"].includes(e.code)) {
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") inputRef.current.dash = false;
      if (e.code === "KeyF") inputRef.current.parry = false;
      if (e.code === "KeyJ" || e.code === "Space") inputRef.current.strike = false;
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
      let mx = 0;
      let my = 0;
      if (k.KeyA || k.ArrowLeft) mx -= 1;
      if (k.KeyD || k.ArrowRight) mx += 1;
      if (k.KeyW || k.ArrowUp) my -= 1;
      if (k.KeyS || k.ArrowDown) my += 1;
      // touch pad overlays if set
      if (inputRef.current.moveX !== 0 || inputRef.current.moveY !== 0) {
        if (mx === 0 && my === 0) {
          mx = inputRef.current.moveX;
          my = inputRef.current.moveY;
        }
      }
      inputRef.current.moveX = mx;
      inputRef.current.moveY = my;
      inputRef.current.dash = !!(k.ShiftLeft || k.ShiftRight) || inputRef.current.dash;
      inputRef.current.parry = !!k.KeyF || inputRef.current.parry;
      inputRef.current.strike = !!(k.KeyJ || k.Space) || inputRef.current.strike;

      const wasOver = stateRef.current.over;
      const p2 = botInput(stateRef.current);
      stateRef.current = stepSV(stateRef.current, dt, inputRef.current, p2);
      // edge-trigger actions from hold keys handled each frame; clear one-shots from buttons
      inputRef.current.dash = !!(k.ShiftLeft || k.ShiftRight);
      inputRef.current.parry = !!k.KeyF;
      inputRef.current.strike = !!(k.KeyJ || k.Space);

      const s = stateRef.current;
      const sc = scoreFromSV(s);
      setHud({
        hp: s.p1.hp,
        eHp: s.p2.hp,
        energy: s.p1.energy,
        msg: s.message,
        score: sc,
        over: s.over,
      });
      onScore(sc, false);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        const w = canvas.width;
        const h = canvas.height;
        const scale = Math.min(w, h) / (s.arena * 2.4);
        const cx = w / 2;
        const cy = h / 2;
        const to = (x: number, y: number) => ({
          x: cx + x * scale,
          y: cy + y * scale,
        });

        ctx.fillStyle = "#081018";
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "#2a3a44";
        ctx.strokeRect(
          cx - s.arena * scale,
          cy - s.arena * scale,
          s.arena * 2 * scale,
          s.arena * 2 * scale,
        );

        for (const z of s.zones) {
          if (z.dead) continue;
          const p = to(z.x, z.y);
          ctx.beginPath();
          ctx.arc(p.x, p.y, z.r * scale, 0, Math.PI * 2);
          if (z.windup > 0) {
            ctx.strokeStyle = "rgba(242,193,78,0.7)";
            ctx.stroke();
          } else {
            ctx.fillStyle = "rgba(110,200,255,0.35)";
            ctx.fill();
          }
        }

        const drawF = (f: typeof s.p1, color: string) => {
          const p = to(f.pos.x, f.pos.y);
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + Math.cos(f.facing) * 18, p.y + Math.sin(f.facing) * 18);
          ctx.stroke();
          if (f.parryWindow > 0) {
            ctx.strokeStyle = "#c9a0ff";
            ctx.beginPath();
            ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
            ctx.stroke();
          }
        };
        drawF(s.p1, "#3dcf9a");
        drawF(s.p2, "#ff6b6b");
      }

      if (s.over && !wasOver) {
        onScore(sc, true);
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
          HP {hud.hp.toFixed(0)} / ennemi {hud.eHp.toFixed(0)} · énergie{" "}
          {(hud.energy * 100).toFixed(0)}% · {hud.score}
        </span>
        <button type="button" className="ghost-btn" onClick={reset}>
          {running ? "Reset" : "Duel"}
        </button>
      </div>
      <div className="canvas-slot">
        <canvas ref={canvasRef} className="game-canvas" width={720} height={720} />
      </div>
      <p className="hint">{hud.msg}</p>
      <div className="bj-actions">
        <TouchPad
          mode="dpad"
          onDir={(d) => {
            inputRef.current.moveX = d.x;
            inputRef.current.moveY = d.y;
          }}
          onDirEnd={() => {
            inputRef.current.moveX = 0;
            inputRef.current.moveY = 0;
          }}
        />
        <button
          type="button"
          className="ghost-btn"
          onPointerDown={() => {
            inputRef.current.dash = true;
          }}
        >
          Dash
        </button>
        <button
          type="button"
          className="ghost-btn"
          onPointerDown={() => {
            inputRef.current.parry = true;
          }}
        >
          Parry
        </button>
        <button
          type="button"
          className="primary-btn"
          onPointerDown={() => {
            inputRef.current.strike = true;
          }}
        >
          Strike
        </button>
      </div>
      {hud.over && <p className="hint">Fin — score {hud.score}</p>}
    </div>
  );
}
