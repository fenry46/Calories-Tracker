import type { Tables, Enums } from "./database";

export type BiologicalSex = Enums<"biological_sex">;
export type WeightGoal = Enums<"weight_goal">;

export type UserProfile = Tables<"user_profiles">;
export type DailyLog = Tables<"daily_logs">;
export type FoodEntry = Tables<"food_entries">;

/** A single recognized food component from the Gemini analysis. */
export interface ScanItem {
  name: string;
  portion: string;
  estimatedCalories: number;
}

/**
 * Normalized result of a food scan, parsed from the n8n/Gemini webhook.
 * The webhook returns Gemini's raw payload; uploadFoodImage() flattens it
 * into this stable shape for the UI.
 */
export interface ScanResult {
  /** Summary label for the whole plate (e.g. "Nasi putih, Ayam goreng"). */
  foodName: string;
  /** Total estimated calories across all items. */
  calories: number;
  /** 0..1 confidence (mapped from Gemini's low/medium/high). */
  confidence: number;
  /** Per-component breakdown (may be empty if nothing was detected). */
  items: ScanItem[];
  /** Free-text note from the model (e.g. why nothing was detected). */
  notes: string;
}
