/** Split Voltage — 1v1 arena simulation (logic-first). */

export type Vec2 = { x: number; y: number };

export type Fighter = {
  id: "p1" | "p2";
  pos: Vec2;
  vel: Vec2;
  facing: number; // radians
  hp: number;
  energy: number;
  dashCd: number;
  parryWindow: number; // >0 = parrying
  stun: number;
  invuln: number;
  score: number;
};

export type ShockZone = {
  id: number;
  x: number;
  y: number;
  r: number;
  windup: number; // telegraph
  active: number; // live duration
  dead: boolean;
};

export type SVInput = {
  moveX: number;
  moveY: number;
  dash: boolean;
  parry: boolean;
  strike: boolean;
};

export type SVState = {
  t: number;
  arena: number; // half-size
  p1: Fighter;
  p2: Fighter;
  zones: ShockZone[];
  nextId: number;
  winner: "p1" | "p2" | null;
  message: string;
  rng: number;
  over: boolean;
};

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function len(v: Vec2) {
  return Math.hypot(v.x, v.y);
}

function norm(v: Vec2): Vec2 {
  const l = len(v) || 1;
  return { x: v.x / l, y: v.y / l };
}

function clampArena(p: Vec2, half: number): Vec2 {
  return {
    x: Math.max(-half, Math.min(half, p.x)),
    y: Math.max(-half, Math.min(half, p.y)),
  };
}

export function createSVState(seed = Date.now()): SVState {
  return {
    t: 0,
    arena: 6,
    p1: {
      id: "p1",
      pos: { x: -2.5, y: 0 },
      vel: { x: 0, y: 0 },
      facing: 0,
      hp: 100,
      energy: 1,
      dashCd: 0,
      parryWindow: 0,
      stun: 0,
      invuln: 0,
      score: 0,
    },
    p2: {
      id: "p2",
      pos: { x: 2.5, y: 0 },
      vel: { x: 0, y: 0 },
      facing: Math.PI,
      hp: 100,
      energy: 1,
      dashCd: 0,
      parryWindow: 0,
      stun: 0,
      invuln: 0,
      score: 0,
    },
    zones: [],
    nextId: 1,
    winner: null,
    message: "Split Voltage — WASD move, Shift dash, F parry, J strike",
    rng: seed >>> 0,
    over: false,
  };
}

/** Simple aggressive bot for p2. */
export function botInput(s: SVState): SVInput {
  const me = s.p2;
  const foe = s.p1;
  const to = { x: foe.pos.x - me.pos.x, y: foe.pos.y - me.pos.y };
  const d = len(to);
  const n = norm(to);

  // Avoid active zones
  let avoid = { x: 0, y: 0 };
  for (const z of s.zones) {
    if (z.dead || (z.windup <= 0 && z.active <= 0)) continue;
    const dx = me.pos.x - z.x;
    const dy = me.pos.y - z.y;
    const dist = Math.hypot(dx, dy);
    if (dist < z.r + 1.2) {
      avoid.x += dx / (dist || 1);
      avoid.y += dy / (dist || 1);
    }
  }

  let moveX = n.x * (d > 1.6 ? 1 : d < 1.1 ? -0.6 : 0.2) + avoid.x;
  let moveY = n.y * (d > 1.6 ? 1 : d < 1.1 ? -0.6 : 0.2) + avoid.y;
  const ml = Math.hypot(moveX, moveY) || 1;
  moveX /= ml;
  moveY /= ml;

  const strike = d < 1.35 && me.stun <= 0 && Math.random() < 0.08;
  const dash = d > 3.2 && me.dashCd <= 0 && me.energy > 0.25 && Math.random() < 0.04;
  const parry = d < 1.5 && foe.vel.x * n.x + foe.vel.y * n.y > 2 && Math.random() < 0.12;

  return { moveX, moveY, dash, parry, strike };
}

function stepFighter(
  f: Fighter,
  dt: number,
  input: SVInput,
  arena: number,
  foe: Fighter,
): { fighter: Fighter; hit: boolean; parried: boolean; dmg: number } {
  const out = {
    ...f,
    pos: { ...f.pos },
    vel: { ...f.vel },
  };
  let hit = false;
  let parried = false;
  let dmg = 0;

  out.dashCd = Math.max(0, out.dashCd - dt);
  out.parryWindow = Math.max(0, out.parryWindow - dt);
  out.stun = Math.max(0, out.stun - dt);
  out.invuln = Math.max(0, out.invuln - dt);
  out.energy = Math.min(1, out.energy + dt * 0.18);

  if (out.stun <= 0) {
    const mx = Math.max(-1, Math.min(1, input.moveX));
    const my = Math.max(-1, Math.min(1, input.moveY));
    const speed = 3.4;
    out.vel.x = mx * speed;
    out.vel.y = my * speed;
    if (mx || my) out.facing = Math.atan2(my, mx);

    if (input.dash && out.dashCd <= 0 && out.energy >= 0.22) {
      const dir =
        Math.hypot(mx, my) > 0.1
          ? norm({ x: mx, y: my })
          : { x: Math.cos(out.facing), y: Math.sin(out.facing) };
      out.vel.x = dir.x * 14;
      out.vel.y = dir.y * 14;
      out.energy -= 0.22;
      out.dashCd = 0.85;
      out.invuln = Math.max(out.invuln, 0.12);
    }

    if (input.parry && out.parryWindow <= 0 && out.energy >= 0.12) {
      out.parryWindow = 0.28;
      out.energy -= 0.12;
    }

    if (input.strike && out.energy >= 0.08) {
      out.energy -= 0.08;
      const reach = 1.25;
      const dx = foe.pos.x - out.pos.x;
      const dy = foe.pos.y - out.pos.y;
      const dist = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx);
      const facingDiff = Math.abs(Math.atan2(Math.sin(ang - out.facing), Math.cos(ang - out.facing)));
      if (dist < reach && facingDiff < 1.1) {
        hit = true;
        dmg = 12;
        // dash bonus
        if (len(out.vel) > 8) dmg = 18;
      }
    }
  } else {
    out.vel.x *= 0.85;
    out.vel.y *= 0.85;
  }

  out.pos.x += out.vel.x * dt;
  out.pos.y += out.vel.y * dt;
  out.pos = clampArena(out.pos, arena);
  // friction after dash burst
  out.vel.x *= Math.max(0, 1 - dt * 3.5);
  out.vel.y *= Math.max(0, 1 - dt * 3.5);

  return { fighter: out, hit, parried, dmg };
}

function applyHit(
  attacker: Fighter,
  defender: Fighter,
  dmg: number,
): { attacker: Fighter; defender: Fighter; parried: boolean } {
  if (defender.invuln > 0) {
    return { attacker, defender, parried: false };
  }
  if (defender.parryWindow > 0) {
    // perfect parry: stun attacker, refund energy
    return {
      attacker: {
        ...attacker,
        stun: 0.55,
        vel: { x: -Math.cos(attacker.facing) * 2, y: -Math.sin(attacker.facing) * 2 },
      },
      defender: {
        ...defender,
        energy: Math.min(1, defender.energy + 0.25),
        parryWindow: 0,
        score: defender.score + 50,
      },
      parried: true,
    };
  }
  return {
    attacker: { ...attacker, score: attacker.score + dmg },
    defender: {
      ...defender,
      hp: Math.max(0, defender.hp - dmg),
      stun: 0.18,
      vel: {
        x: Math.cos(attacker.facing) * 5,
        y: Math.sin(attacker.facing) * 5,
      },
      invuln: 0.2,
    },
    parried: false,
  };
}

export function stepSV(s: SVState, dt: number, p1In: SVInput, p2In: SVInput): SVState {
  if (s.over) return s;
  const rng = mulberry32((s.rng = (s.rng + 1) >>> 0));
  let next: SVState = {
    ...s,
    p1: { ...s.p1, pos: { ...s.p1.pos }, vel: { ...s.p1.vel } },
    p2: { ...s.p2, pos: { ...s.p2.pos }, vel: { ...s.p2.vel } },
    zones: s.zones.map((z) => ({ ...z })),
  };
  next.t += dt;

  // Spawn electrified zones periodically
  if (next.zones.filter((z) => !z.dead).length < 3 && rng() < dt * 0.35) {
    next.zones.push({
      id: next.nextId++,
      x: (rng() * 2 - 1) * (next.arena - 1),
      y: (rng() * 2 - 1) * (next.arena - 1),
      r: 0.9 + rng() * 0.7,
      windup: 0.85,
      active: 1.4,
      dead: false,
    });
  }

  next.zones = next.zones
    .map((z) => {
      if (z.dead) return z;
      if (z.windup > 0) return { ...z, windup: z.windup - dt };
      if (z.active > 0) return { ...z, active: z.active - dt };
      return { ...z, dead: true };
    })
    .filter((z) => !z.dead || z.active > -1);

  const a = stepFighter(next.p1, dt, p1In, next.arena, next.p2);
  const b = stepFighter(next.p2, dt, p2In, next.arena, next.p1);
  next.p1 = a.fighter;
  next.p2 = b.fighter;

  if (a.hit) {
    const r = applyHit(next.p1, next.p2, a.dmg);
    next.p1 = r.attacker;
    next.p2 = r.defender;
    next.message = r.parried ? "P2 parry !" : `P1 hit ${a.dmg}`;
  }
  if (b.hit) {
    const r = applyHit(next.p2, next.p1, b.dmg);
    next.p2 = r.attacker;
    next.p1 = r.defender;
    next.message = r.parried ? "P1 parry !" : `P2 hit ${b.dmg}`;
  }

  // Zone damage
  for (const z of next.zones) {
    if (z.windup > 0 || z.active <= 0) continue;
    for (const key of ["p1", "p2"] as const) {
      const f = next[key];
      if (f.invuln > 0) continue;
      const d = Math.hypot(f.pos.x - z.x, f.pos.y - z.y);
      if (d < z.r) {
        next[key] = {
          ...f,
          hp: Math.max(0, f.hp - dt * 28),
          stun: Math.max(f.stun, 0.05),
        };
      }
    }
  }

  if (next.p1.hp <= 0 || next.p2.hp <= 0) {
    next.over = true;
    next.winner = next.p1.hp <= 0 ? "p2" : "p1";
    next.message =
      next.winner === "p1"
        ? `Victoire P1 — score ${next.p1.score}`
        : `Défaite — score ${next.p1.score}`;
  }

  return next;
}

export function scoreFromSV(s: SVState): number {
  return Math.max(
    0,
    Math.floor(s.p1.score + s.p1.hp * 2 + (s.winner === "p1" ? 500 : 0)),
  );
}
