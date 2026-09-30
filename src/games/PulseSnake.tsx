import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { TouchPad } from "../components/TouchPad";
import { useCanvasFit } from "./useCanvasFit";

type Point = { x: number; y: number };

type Props = {
  onScore: (score: number, final: boolean) => void;
  steerRef?: MutableRefObject<((dir: Point) => void) | null>;
};

const COLS = 18;
const ROWS = 14;
const TICK = 110;

function randFood(snake: Point[]): Point {
  while (true) {
    const p = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
    if (!snake.some((s) => s.x === p.x && s.y === p.y)) return p;
  }
}

export function PulseSnake({ onScore, steerRef }: Props) {
  const [running, setRunning] = useState(false);
  const [dead, setDead] = useState(false);
  const [score, setScore] = useState(0);
  const snakeRef = useRef<Point[]>([
    { x: 4, y: 7 },
    { x: 3, y: 7 },
    { x: 2, y: 7 },
  ]);
  const dirRef = useRef<Point>({ x: 1, y: 0 });
  const nextDirRef = useRef<Point>({ x: 1, y: 0 });
  const foodRef = useRef<Point>(randFood(snakeRef.current));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef(0);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const cell = Math.min(cw / COLS, ch / ROWS);
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = "#081614";
    ctx.fillRect(0, 0, cw, ch);

    const food = foodRef.current;
    ctx.fillStyle = "#f2c14e";
    ctx.beginPath();
    ctx.arc((food.x + 0.5) * cell, (food.y + 0.5) * cell, cell * 0.28, 0, Math.PI * 2);
    ctx.fill();

    snakeRef.current.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? "#3dcf9a" : "rgba(61, 207, 154, 0.65)";
      ctx.fillRect(p.x * cell + 1, p.y * cell + 1, cell - 2, cell - 2);
    });
  };

  useCanvasFit(canvasRef, COLS / ROWS, draw);

  useEffect(() => {
    draw();
  });

  useEffect(() => {
    const applyDir = (d: Point) => {
      const cur = dirRef.current;
      if (d.x + cur.x === 0 && d.y + cur.y === 0) return;
      nextDirRef.current = d;
    };
    if (steerRef) steerRef.current = applyDir;

    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Point> = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 },
      };
      const d = map[e.key];
      if (!d) return;
      e.preventDefault();
      applyDir(d);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (steerRef) steerRef.current = null;
    };
  }, [steerRef]);

  useEffect(() => {
    if (!running || dead) return;
    const id = window.setInterval(() => {
      dirRef.current = nextDirRef.current;
      const dir = dirRef.current;
      const snake = snakeRef.current;
      const head = {
        x: snake[0].x + dir.x,
        y: snake[0].y + dir.y,
      };
      if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= COLS ||
        head.y >= ROWS ||
        snake.some((s) => s.x === head.x && s.y === head.y)
      ) {
        setDead(true);
        setRunning(false);
        onScore(scoreRef.current, true);
        return;
      }
      const next = [head, ...snake];
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        scoreRef.current += 10;
        setScore(scoreRef.current);
        onScore(scoreRef.current, false);
        foodRef.current = randFood(next);
      } else {
        next.pop();
      }
      snakeRef.current = next;
      draw();
    }, TICK);
    return () => clearInterval(id);
  }, [running, dead, onScore]);

  const start = () => {
    snakeRef.current = [
      { x: 4, y: 7 },
      { x: 3, y: 7 },
      { x: 2, y: 7 },
    ];
    dirRef.current = { x: 1, y: 0 };
    nextDirRef.current = { x: 1, y: 0 };
    foodRef.current = randFood(snakeRef.current);
    scoreRef.current = 0;
    setScore(0);
    setDead(false);
    setRunning(true);
    onScore(0, false);
    draw();
  };

  return (
    <div className="game-wrap">
      <div className="game-hud">
        <span>Score {score}</span>
        <button type="button" className="ghost-btn" onClick={start}>
          {running ? "Relancer" : dead ? "Rejouer" : "Start"}
        </button>
      </div>
      <div className="canvas-slot">
        <canvas ref={canvasRef} width={540} height={420} className="game-canvas" />
      </div>
      <TouchPad
        mode="dpad"
        onDir={(d) => {
          const cur = dirRef.current;
          if (d.x + cur.x === 0 && d.y + cur.y === 0) return;
          nextDirRef.current = d;
        }}
      />
      <p className="hint">Flèches, WASD ou pad tactile</p>
    </div>
  );
}
