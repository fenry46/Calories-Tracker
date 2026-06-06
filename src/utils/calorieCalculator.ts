import type { BiologicalSex, WeightGoal } from "../types/models";

/** Sedentary activity multiplier (PRD §1.3 / Tech Spec §4). */
export const SEDENTARY_ACTIVITY_FACTOR = 1.2;

/** Safe floor for a weight-loss target (PRD §1.3). */
export const MIN_SAFE_CALORIES = 1200;

export const GOAL_ADJUSTMENT: Record<WeightGoal, number> = {
  LOSE: -500,
  MAINTAIN: 0,
  GAIN: 400,
};

export interface Metrics {
  biologicalSex: BiologicalSex;
  age: number; // years
  weightKg: number;
  heightCm: number;
}

/**
 * Basal Metabolic Rate via the Mifflin-St Jeor equation.
 *   Male:   10*kg + 6.25*cm - 5*age + 5
 *   Female: 10*kg + 6.25*cm - 5*age - 161
 */
export function calcBMR({
  biologicalSex,
  age,
  weightKg,
  heightCm,
}: Metrics): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return biologicalSex === "MALE" ? base + 5 : base - 161;
}

/** Total Daily Energy Expenditure (sedentary baseline). */
export function calcTDEE(bmr: number): number {
  return bmr * SEDENTARY_ACTIVITY_FACTOR;
}

/**
 * Apply the goal adjustment to TDEE and floor LOSE targets at the safe minimum.
 * Returns a rounded integer calorie target.
 */
export function calcTarget(tdee: number, goal: WeightGoal): number {
  const adjusted = tdee + GOAL_ADJUSTMENT[goal];
  const floored = goal === "LOSE" ? Math.max(adjusted, MIN_SAFE_CALORIES) : adjusted;
  return Math.round(floored);
}

/** Convenience: metrics + goal -> daily calorie target (integer). */
export function calcDailyCalorieTarget(metrics: Metrics, goal: WeightGoal): number {
  return calcTarget(calcTDEE(calcBMR(metrics)), goal);
}

// ---- Unit conversion helpers (canonical storage is kg / cm) ----
export const lbsToKg = (lbs: number): number => lbs * 0.45359237;
export const kgToLbs = (kg: number): number => kg / 0.45359237;
export const inToCm = (inches: number): number => inches * 2.54;
export const cmToIn = (cm: number): number => cm / 2.54;
