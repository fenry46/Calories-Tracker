import { create } from "zustand";

import { supabase } from "../lib/supabase";
import type {
  UserProfile,
  DailyLog,
  FoodEntry,
  BiologicalSex,
  WeightGoal,
} from "../types/models";
import { calcDailyCalorieTarget } from "../utils/calorieCalculator";
import { localDateISO } from "../utils/date";

export interface ProfileInput {
  name: string;
  biologicalSex: BiologicalSex;
  age: number;
  weightKg: number;
  heightCm: number;
  goal: WeightGoal;
}

interface CalorieState {
  profile: UserProfile | null;
  /** True once we've checked the DB for a profile (drives onboarding gate). */
  profileLoaded: boolean;

  selectedDate: string; // YYYY-MM-DD
  log: DailyLog | null;
  entries: FoodEntry[];
  isLoading: boolean;

  loadProfile: () => Promise<void>;
  createProfile: (input: ProfileInput) => Promise<{ error?: string }>;
  updateProfile: (input: ProfileInput) => Promise<{ error?: string }>;
  selectDate: (date: string) => Promise<void>;
  refresh: () => Promise<void>;
  addFoodEntry: (
    foodName: string,
    calories: number
  ) => Promise<{ entry?: FoodEntry; error?: string }>;
  removeFoodEntry: (entryId: string) => Promise<{ error?: string }>;
  reset: () => void;
}

export const useCalorieStore = create<CalorieState>((set, get) => ({
  profile: null,
  profileLoaded: false,
  selectedDate: localDateISO(),
  log: null,
  entries: [],
  isLoading: false,

  loadProfile: async () => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .maybeSingle();
    if (error) {
      set({ profileLoaded: true });
      return;
    }
    set({ profile: data, profileLoaded: true });
    if (data) await get().selectDate(get().selectedDate);
  },

  createProfile: async (input) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const target = calcDailyCalorieTarget(
      {
        biologicalSex: input.biologicalSex,
        age: input.age,
        weightKg: input.weightKg,
        heightCm: input.heightCm,
      },
      input.goal
    );

    const { data, error } = await supabase
      .from("user_profiles")
      .insert({
        user_id: user.id,
        name: input.name,
        biological_sex: input.biologicalSex,
        age: input.age,
        weight: input.weightKg,
        height: input.heightCm,
        goal: input.goal,
        daily_calorie_target: target,
      })
      .select("*")
      .single();

    if (error) return { error: error.message };
    set({ profile: data });
    await get().selectDate(localDateISO());
    return {};
  },

  // Edit an existing profile (from Settings). Recomputes the daily target from
  // the new metrics — same Mifflin-St Jeor path as createProfile. Direct table
  // update is allowed by the user_profiles RLS update policy.
  updateProfile: async (input) => {
    const { profile } = get();
    if (!profile) return { error: "No profile" };

    const target = calcDailyCalorieTarget(
      {
        biologicalSex: input.biologicalSex,
        age: input.age,
        weightKg: input.weightKg,
        heightCm: input.heightCm,
      },
      input.goal
    );

    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        name: input.name,
        biological_sex: input.biologicalSex,
        age: input.age,
        weight: input.weightKg,
        height: input.heightCm,
        goal: input.goal,
        daily_calorie_target: target,
      })
      .eq("user_id", profile.user_id)
      .select("*")
      .single();

    if (error) return { error: error.message };

    // Keep TODAY's log target in sync with the new goal so the dashboard/ring
    // reflect it immediately. get_or_create_log only sets total_target on
    // creation, so an existing row keeps its old target until we update it.
    // Past days are intentionally left as historical record. Allowed by the
    // daily_logs RLS update policy.
    await supabase
      .from("daily_logs")
      .update({ total_target: target })
      .eq("user_profile_id", data.id)
      .eq("date", localDateISO());

    set({ profile: data });
    await get().selectDate(get().selectedDate);
    return {};
  },

  selectDate: async (date) => {
    const { profile } = get();
    set({ selectedDate: date });
    if (!profile) return;
    set({ isLoading: true });

    const { data: log, error: logErr } = await supabase.rpc("get_or_create_log", {
      p_date: date,
      p_target: profile.daily_calorie_target,
    });

    if (logErr || !log) {
      set({ isLoading: false, log: null, entries: [] });
      return;
    }

    const { data: entries } = await supabase
      .from("food_entries")
      .select("*")
      .eq("daily_log_id", log.id)
      .order("scanned_at", { ascending: false });

    set({ log, entries: entries ?? [], isLoading: false });
  },

  refresh: async () => {
    await get().selectDate(get().selectedDate);
  },

  // Scans + manual entries always land on *today* (PRD §3.3), then we jump the
  // view to today so the user sees the new entry and updated remaining total.
  addFoodEntry: async (foodName, calories) => {
    const { profile } = get();
    if (!profile) return { error: "No profile" };
    const today = localDateISO();

    const { data: entry, error } = await supabase.rpc("add_food_entry", {
      p_food_name: foodName,
      p_calories: Math.round(calories),
      p_date: today,
      p_target: profile.daily_calorie_target,
    });

    if (error) return { error: error.message };

    await get().selectDate(today);
    return { entry: entry ?? undefined };
  },

  removeFoodEntry: async (entryId) => {
    const { error } = await supabase.rpc("delete_food_entry", {
      p_entry_id: entryId,
    });
    if (error) return { error: error.message };
    await get().refresh();
    return {};
  },

  reset: () =>
    set({
      profile: null,
      profileLoaded: false,
      selectedDate: localDateISO(),
      log: null,
      entries: [],
      isLoading: false,
    }),
}));
