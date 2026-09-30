import { useEffect, useRef, useState } from "react";
import { TouchPad } from "../components/TouchPad";

type Props = {
  onScore: (score: number, final: boolean) => void;
};

type Brick = { x: number; y: number; w: number; h: number; alive: boolean };

const W = 540;
const H = 420;

function makeBricks(): Brick[] {
  const bricks: Brick[] = [];
  const cols = 9;
  const rows = 5;
  const bw = 50;
  const bh = 16;
  const gap = 6;
  const offsetX = (W - cols * (bw + gap) + gap) / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      bricks.push({
        x: offsetX + c * (bw + gap),
        y: 40 + r * (bh + gap),
        w: bw,
        h: bh,
        alive: true,
      });
    }
  }
  return bricks;
}

export function DriftBreaker({ onScore }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const paddleX = useRef(W / 2 - 40);
  const ball = useRef({ x: W / 2, y: H - 60, vx: 3.2, vy: -3.6 });
  const bricks = useRef(makeBricks());
  const keys = useRef({ left: false, right: false });
  const combo = useRef(0);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#081614";
    ctx.fillRect(0, 0, W, H);

    bricks.current.forEach((b, i) => {
      if (!b.alive) return;
      ctx.fillStyle = i % 2 === 0 ? "#6ec8ff" : "#3dcf9a";
      ctx.fillRect(b.x, b.y, b.w, b.h);
    });

    ctx.fillStyle = "#f2c14e";
    ctx.fillRect(paddleX.current, H - 28, 80, 10);

    ctx.beginPath();
    ctx.fillStyle = "#e8efe9";
    ctx.arc(ball.current.x, ball.current.y, 6, 0, Math.PI * 2);
    ctx.fill();
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    draw();
  });

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      if (keys.current.left) paddleX.current = Math.max(0, paddleX.current - 6);
      if (keys.current.right) paddleX.current = Math.min(W - 80, paddleX.current + 6);

      const b = ball.current;
      b.x += b.vx;
      b.y += b.vy;

      if (b.x < 6 || b.x > W - 6) b.vx *= -1;
      if (b.y < 6) b.vy *= -1;

      if (b.y > H - 34 && b.x > paddleX.current && b.x < paddleX.current + 80 && b.vy > 0) {
        b.vy *= -1;
        const offset = (b.x - (paddleX.current + 40)) / 40;
        b.vx = offset * 4.2;
        combo.current = 0;
      }

      if (b.y > H) {
        livesRef.current -= 1;
        setLives(livesRef.current);
        combo.current = 0;
        if (livesRef.current <= 0) {
          setRunning(false);
          onScore(scoreRef.current, true);
          draw();
          return;
        }
        ball.current = { x: W / 2, y: H - 60, vx: 3.2, vy: -3.6 };
        paddleX.current = W / 2 - 40;
      }

      for (const brick of bricks.current) {
        if (!brick.alive) continue;
        if (
          b.x > brick.x &&
          b.x < brick.x + brick.w &&
          b.y > brick.y &&
          b.y < brick.y + brick.h
        ) {
          brick.alive = false;
          b.vy *= -1;
          combo.current += 1;
          scoreRef.current += 10 * combo.current;
          setScore(scoreRef.current);
          onScore(scoreRef.current, false);
        }
      }

      if (bricks.current.every((br) => !br.alive)) {
        setRunning(false);
        onScore(scoreRef.current, true);
        draw();
        return;
      }

      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, onScore]);

  const start = () => {
    bricks.current = makeBricks();
    ball.current = { x: W / 2, y: H - 60, vx: 3.2, vy: -3.6 };
    paddleX.current = W / 2 - 40;
    scoreRef.current = 0;
    livesRef.current = 3;
    combo.current = 0;
    setScore(0);
    setLives(3);
    setRunning(true);
    onScore(0, false);
  };

  return (
    <div className="game-wrap">
      <div className="game-hud">
        <span>
          Score {score} · Vies {lives}
        </span>
        <button type="button" className="ghost-btn" onClick={start}>
          {running ? "Relancer" : "Start"}
        </button>
      </div>
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas game-canvas-fixed" />
      <TouchPad
        mode="lr"
        onDir={(d) => {
          keys.current.left = d.x < 0;
          keys.current.right = d.x > 0;
        }}
        onDirEnd={() => {
          keys.current.left = false;
          keys.current.right = false;
        }}
      />
      <p className="hint">← →, A / D ou pad tactile</p>
    </div>
  );
}
