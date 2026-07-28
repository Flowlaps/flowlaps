// A small seeded PRNG so generated mock data is deterministic across renders
// and test runs, instead of drifting every time it's generated.
export function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Can return a negative number (32-bit signed overflow via `|= 0`) — that's
// fine as a mulberry32 seed since its state is coerced with `|= 0` too, so
// there's no need to normalize it with Math.abs().
export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
