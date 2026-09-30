/** Ash Circuit — pure simulation (logic-first). Units: seconds, lane ∈ [-1,1]. */

export type SegmentKind = "straight" | "chicane" | "hack" | "boss";

export type Obstacle = {
  id: number;
  z: number; // distance ahead of player (0 = at player)
  lane: number; // -1 | 0 | 1 roughly
  w: number;
  kind: "barrier" | "mine" | "drone";
};

export type HackPort = {
  id: number;
  z: number;
  lane: number;
  window: number; // seconds left when in range
  hacked: boolean;
};

export type BossState = {
  active: boolean;
  hp: number;
  maxHp: number;
  phase: number;
  attackCd: number;
  telegraph: number; // >0 means attack incoming
  attackLane: number;
};

export type AshInput = {
  steer: number; // -1..1
  drift: boolean;
  boost: boolean;
  hack: boolean;
};

export type AshState = {
  alive: boolean;
  wonLoop: boolean;
  t: number;
  distance: number;
  lane: number;
  speed: number;
  yaw: number;
  driftGrip: number;
  boostFuel: number;
  score: number;
  combo: number;
  comboTimer: number;
  segmentIndex: number;
  segmentKind: SegmentKind;
  segmentLen: number;
  segmentProg: number;
  obstacles: Obstacle[];
  ports: HackPort[];
  boss: BossState;
  message: string;
  nextId: number;
  rng: number;
};

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function nextSeg(kindIndex: number, rng: () => number): { kind: SegmentKind; len: number } {
  const cycle: SegmentKind[] = ["straight", "chicane", "hack", "straight", "boss"];
  const kind = cycle[kindIndex % cycle.length];
  if (kind === "boss") return { kind, len: 40 + rng() * 20 };
  if (kind === "hack") return { kind, len: 35 + rng() * 15 };
  if (kind === "chicane") return { kind, len: 45 + rng() * 25 };
  return { kind, len: 50 + rng() * 30 };
}

export function createAshState(seed = Date.now()): AshState {
  const rng = mulberry32(seed >>> 0);
  const first = nextSeg(0, rng);
  return {
    alive: true,
    wonLoop: false,
    t: 0,
    distance: 0,
    lane: 0,
    speed: 18,
    yaw: 0,
    driftGrip: 1,
    boostFuel: 1,
    score: 0,
    combo: 0,
    comboTimer: 0,
    segmentIndex: 0,
    segmentKind: first.kind,
    segmentLen: first.len,
    segmentProg: 0,
    obstacles: [],
    ports: [],
    boss: {
      active: false,
      hp: 0,
      maxHp: 0,
      phase: 0,
      attackCd: 0,
      telegraph: 0,
      attackLane: 0,
    },
    message: "Ash Circuit — flèches / A D, Shift drift, Espace boost, F hack",
    nextId: 1,
    rng: seed >>> 0,
  };
}

function spawnForSegment(s: AshState, rng: () => number) {
  const dens =
    s.segmentKind === "chicane" ? 0.55 : s.segmentKind === "straight" ? 0.28 : 0.2;
  if (s.segmentKind === "boss") return;

  if (rng() < dens * 0.08) {
    const lane = Math.floor(rng() * 3) - 1;
    const kinds: Obstacle["kind"][] = ["barrier", "mine", "drone"];
    s.obstacles.push({
      id: s.nextId++,
      z: 55 + rng() * 25,
      lane: lane + (rng() - 0.5) * 0.2,
      w: 0.35 + rng() * 0.25,
      kind: kinds[Math.floor(rng() * kinds.length)],
    });
  }

  if (s.segmentKind === "hack" && s.ports.filter((p) => !p.hacked && p.z > 0).length < 2) {
    if (rng() < 0.04) {
      s.ports.push({
        id: s.nextId++,
        z: 40 + rng() * 30,
        lane: Math.floor(rng() * 3) - 1,
        window: 0,
        hacked: false,
      });
    }
  }
}

function enterBoss(s: AshState) {
  const hp = 80 + s.segmentIndex * 25;
  s.boss = {
    active: true,
    hp,
    maxHp: hp,
    phase: 1,
    attackCd: 1.2,
    telegraph: 0,
    attackLane: 0,
  };
  s.message = "BOSS RUN — esquive les rails, drift près pour dégâts";
  s.obstacles = [];
  s.ports = [];
}

function finishSegment(s: AshState, rng: () => number) {
  s.segmentIndex += 1;
  const next = nextSeg(s.segmentIndex, rng);
  s.segmentKind = next.kind;
  s.segmentLen = next.len;
  s.segmentProg = 0;
  s.score += 200 + s.combo * 10;
  if (next.kind === "boss") enterBoss(s);
  else {
    s.boss.active = false;
    s.message = `Segment ${s.segmentIndex + 1}: ${next.kind}`;
  }
}

export function stepAsh(s: AshState, dt: number, input: AshInput): AshState {
  if (!s.alive) return s;
  const rng = mulberry32((s.rng = (s.rng + 1) >>> 0));
  const next: AshState = {
    ...s,
    obstacles: s.obstacles.map((o) => ({ ...o })),
    ports: s.ports.map((p) => ({ ...p })),
    boss: { ...s.boss },
  };

  next.t += dt;
  next.comboTimer = Math.max(0, next.comboTimer - dt);
  if (next.comboTimer <= 0) next.combo = 0;

  // Steering / drift physics
  const steer = Math.max(-1, Math.min(1, input.steer));
  const drifting = input.drift && Math.abs(steer) > 0.2 && next.speed > 14;
  if (drifting) {
    next.driftGrip = Math.max(0.35, next.driftGrip - dt * 0.45);
    next.yaw += steer * dt * 2.8;
    next.lane += steer * dt * (1.8 + (1 - next.driftGrip) * 1.2);
    next.combo = Math.min(99, next.combo + dt * 4);
    next.comboTimer = 1.5;
    next.score += Math.floor(dt * 40 * (1 + next.combo * 0.05));
  } else {
    next.driftGrip = Math.min(1, next.driftGrip + dt * 0.7);
    next.yaw *= Math.max(0, 1 - dt * 4);
    next.lane += steer * dt * 1.4 * next.driftGrip;
  }
  next.lane = Math.max(-1.15, Math.min(1.15, next.lane));

  // Boost
  if (input.boost && next.boostFuel > 0) {
    next.boostFuel = Math.max(0, next.boostFuel - dt * 0.35);
    next.speed = Math.min(42, next.speed + dt * 28);
    next.score += Math.floor(dt * 25);
  } else {
    next.boostFuel = Math.min(1, next.boostFuel + dt * 0.12);
    const target = 18 + Math.min(12, next.distance / 400);
    next.speed += (target - next.speed) * Math.min(1, dt * 1.6);
  }

  const travel = next.speed * dt;
  next.distance += travel;
  next.segmentProg += travel;

  // World scroll
  next.obstacles = next.obstacles
    .map((o) => ({ ...o, z: o.z - travel }))
    .filter((o) => o.z > -4);
  next.ports = next.ports
    .map((p) => ({ ...p, z: p.z - travel }))
    .filter((p) => p.z > -4 || p.hacked);

  spawnForSegment(next, rng);

  // Hack ports
  for (const p of next.ports) {
    if (p.hacked) continue;
    const near = p.z < 8 && p.z > 0 && Math.abs(p.lane - next.lane) < 0.55;
    if (near) {
      p.window = Math.min(1.2, p.window + dt);
      if (input.hack && p.window > 0.15) {
        p.hacked = true;
        next.boostFuel = 1;
        next.combo = Math.min(99, next.combo + 8);
        next.comboTimer = 2;
        next.score += 350 * (1 + next.combo * 0.02);
        next.message = "PORT HACKED — boost plein";
        if (next.boss.active) {
          next.boss.hp -= 18;
        }
      }
    } else {
      p.window = Math.max(0, p.window - dt * 2);
    }
  }

  // Collisions
  for (const o of next.obstacles) {
    if (o.z > 1.2 || o.z < -0.4) continue;
    if (Math.abs(o.lane - next.lane) > o.w + 0.22) continue;
    if (drifting && o.kind === "drone" && next.driftGrip < 0.7) {
      // drift graze bonus
      next.score += 80;
      next.combo += 2;
      next.comboTimer = 1.5;
      o.z = -10;
      continue;
    }
    next.alive = false;
    next.message = `Crash (${o.kind}) — score ${next.score}`;
    return next;
  }

  // Wall scrape
  if (Math.abs(next.lane) > 1.05 && !drifting) {
    next.alive = false;
    next.message = `Sortie de piste — score ${next.score}`;
    return next;
  }

  // Boss logic
  if (next.boss.active) {
    next.boss.attackCd -= dt;
    if (next.boss.telegraph > 0) {
      next.boss.telegraph -= dt;
      if (next.boss.telegraph <= 0) {
        // resolve attack
        if (Math.abs(next.lane - next.boss.attackLane) < 0.45 && !drifting) {
          next.alive = false;
          next.message = `Rail boss — score ${next.score}`;
          return next;
        }
        if (drifting && Math.abs(next.lane - next.boss.attackLane) < 0.7) {
          next.boss.hp -= 12 + next.combo * 0.5;
          next.score += 120;
          next.message = "Drift counter !";
        }
        next.boss.attackCd = Math.max(0.55, 1.4 - next.boss.phase * 0.15);
      }
    } else if (next.boss.attackCd <= 0) {
      next.boss.attackLane = Math.floor(rng() * 3) - 1;
      next.boss.telegraph = 0.55;
      next.message = `Boss charge lane ${next.boss.attackLane}`;
    }

    // Passive boss damage while close & drifting
    if (drifting && next.segmentProg > next.segmentLen * 0.3) {
      next.boss.hp -= dt * 6;
    }

    if (next.boss.hp <= next.boss.maxHp * 0.5 && next.boss.phase === 1) {
      next.boss.phase = 2;
      next.message = "Boss phase 2";
      // spawn side ports
      next.ports.push({
        id: next.nextId++,
        z: 25,
        lane: -1,
        window: 0,
        hacked: false,
      });
      next.ports.push({
        id: next.nextId++,
        z: 32,
        lane: 1,
        window: 0,
        hacked: false,
      });
    }

    if (next.boss.hp <= 0) {
      next.boss.active = false;
      next.score += 1500;
      next.wonLoop = true;
      next.message = `Boss down — loop ${next.segmentIndex + 1}`;
      finishSegment(next, rng);
    } else if (next.segmentProg >= next.segmentLen && next.boss.hp > 0) {
      // timeout fail soft: boss escapes, continue
      next.score += 100;
      next.message = "Boss s'échappe…";
      finishSegment(next, rng);
    }
  } else if (next.segmentProg >= next.segmentLen) {
    finishSegment(next, rng);
  }

  next.score += Math.floor(travel * 2);
  return next;
}
