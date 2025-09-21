// src/utils/scoring.ts
// Continuous 36-hole scoring with optional per-round totals.
// Round 1 = first course, Round 2 = second course.
// Uses the simplified config (round -> course pars).

import { COURSE_PARS_BY_ROUND, CoursePars } from "../config/coursePars";

/** Constants */
export const HOLES_PER_ROUND = 18 as const;
export const ROUNDS = [1, 2] as const;

export type Stroke = number | null | undefined;
/** We allow variable length but treat 36 as the full tournament length */
export type Strokes36 = Array<Stroke>; // indexes 0..35 (0-17 = R1, 18-35 = R2)

/** Get course pars for a given round (1 or 2) */
export function getCoursePars(roundNumber: number): CoursePars {
  const cfg = COURSE_PARS_BY_ROUND[roundNumber];
  if (!cfg) throw new Error(`No par config for round=${roundNumber}`);
  return cfg;
}

/** Get the 0-based global index in the 36-hole array for a (round, hole1Based) */
export function getHoleGlobalIndex(roundNumber: number, hole1Based: number): number {
  if (roundNumber !== 1 && roundNumber !== 2) {
    throw new Error(`round must be 1 or 2, got ${roundNumber}`);
  }
  if (hole1Based < 1 || hole1Based > HOLES_PER_ROUND) {
    throw new Error(`hole must be 1..${HOLES_PER_ROUND}, got ${hole1Based}`);
  }
  const roundOffset = (roundNumber - 1) * HOLES_PER_ROUND;
  return roundOffset + (hole1Based - 1);
}

/** Safely set a stroke in the 36 array and return a NEW array (immutability) */
export function setStroke(
  strokes36: Strokes36,
  roundNumber: number,
  hole1Based: number,
  value: number | null | undefined
): Strokes36 {
  const idx = getHoleGlobalIndex(roundNumber, hole1Based);
  const next = [...(strokes36 ?? [])];
  next[idx] = value ?? null;
  return next;
}

/** Format +/− string (e.g., "+3", "E", "-2") */
export function formatToPar(n: number): string {
  if (!Number.isFinite(n)) return "E";
  if (n === 0) return "E";
  return n > 0 ? `+${n}` : `${n}`;
}

/** Per-hole label (Birdie/Par/Bogey/etc.) */
export function holeResultLabel(strokes: Stroke, par?: number): string {
  if (strokes == null || par == null) return "";
  const d = Number(strokes) - par;
  if (!Number.isFinite(d)) return "";
  if (d <= -3) return "Albatross";
  if (d === -2) return "Eagle";
  if (d === -1) return "Birdie";
  if (d === 0) return "Par";
  if (d === 1) return "Bogey";
  if (d === 2) return "Double";
  return `${d}+`;
}

/** Compute totals for a single round (uses only that round's entered holes) */
export function computeRoundTotals(
  strokes36: Strokes36,
  roundNumber: number
): { strokesTotal: number; parTotal: number; toPar: number } {
  const course = getCoursePars(roundNumber);
  let strokesTotal = 0;
  let parTotal = 0;

  for (let i = 0; i < HOLES_PER_ROUND; i++) {
    const par = course.holes[i] ?? 0;
    const idx = getHoleGlobalIndex(roundNumber, i + 1);
    const s = strokes36?.[idx];

    if (s != null && !Number.isNaN(Number(s))) {
      strokesTotal += Number(s);
      parTotal += par;
    }
  }

  return { strokesTotal, parTotal, toPar: strokesTotal - parTotal };
}

/** Compute tournament totals across BOTH rounds (continuous 36-hole scoring) */
export function computeTournamentTotals(
  strokes36: Strokes36
): { strokesTotal: number; parTotal: number; toPar: number } {
  let strokesTotal = 0;
  let parTotal = 0;

  for (const roundNumber of ROUNDS) {
    const course = getCoursePars(roundNumber);
    const roundOffset = (roundNumber - 1) * HOLES_PER_ROUND;

    for (let i = 0; i < HOLES_PER_ROUND; i++) {
      const par = course.holes[i] ?? 0;
      const s = strokes36?.[roundOffset + i];

      if (s != null && !Number.isNaN(Number(s))) {
        strokesTotal += Number(s);
        parTotal += par;
      }
    }
  }

  return { strokesTotal, parTotal, toPar: strokesTotal - parTotal };
}

/** Convenience: get the course name for the selected round */
export function getCourseName(roundNumber: number): string {
  return getCoursePars(roundNumber).courseName ?? `Round ${roundNumber}`;
}

/** Optional: compute partial (front/back) within a round (holes 1-9 or 10-18) */
export function computeRoundSegmentTotals(
  strokes36: Strokes36,
  roundNumber: number,
  startHole1Based: number, // e.g., 1 or 10
  endHole1Based: number    // e.g., 9 or 18
): { strokesTotal: number; parTotal: number; toPar: number } {
  if (startHole1Based < 1 || endHole1Based > HOLES_PER_ROUND || startHole1Based > endHole1Based) {
    throw new Error(`segment must be within 1..${HOLES_PER_ROUND} and start <= end`);
    }
  const course = getCoursePars(roundNumber);
  let strokesTotal = 0;
  let parTotal = 0;

  for (let h = startHole1Based; h <= endHole1Based; h++) {
    const par = course.holes[h - 1] ?? 0;
    const idx = getHoleGlobalIndex(roundNumber, h);
    const s = strokes36?.[idx];

    if (s != null && !Number.isNaN(Number(s))) {
      strokesTotal += Number(s);
      parTotal += par;
    }
  }

  return { strokesTotal, parTotal, toPar: strokesTotal - parTotal };
}

/** Utility: given selectedRound and hole index (0-based within the round), get that hole's par */
export function getParForHole(roundNumber: number, holeIndex0: number): number | undefined {
  const course = getCoursePars(roundNumber);
  return course.holes[holeIndex0];
}

/** UI helper: build 18 tiles data for the selected round */
export function getRoundHoleMeta(roundNumber: number) {
  const course = getCoursePars(roundNumber);
  return Array.from({ length: HOLES_PER_ROUND }, (_, i) => ({
    hole1Based: i + 1,
    par: course.holes[i],
  }));
}

/** Ensure the strokes array is at least 36 slots (filled with nulls) */
export function ensureStrokes36(strokes36?: Strokes36 | null): Strokes36 {
  const arr = Array.isArray(strokes36) ? [...strokes36] : [];
  while (arr.length < HOLES_PER_ROUND * ROUNDS.length) arr.push(null);
  return arr;
}
