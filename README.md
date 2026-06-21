# Calorie Tracker

A React Native (Expo) calorie-tracking app. Users onboard with health metrics,
get a personalized daily calorie target (Mifflin-St Jeor), and log food by
photographing it — the photo is sent to an n8n webhook that returns the food
name and estimated calories, which are deducted from the day's budget.

## Stack
- **Expo SDK 54** (React 19.1 / RN 0.81) + **TypeScript** — pinned to 54 because public Expo Go only supports up to SDK 54
- **React Navigation** (native-stack + bottom-tabs) — auth/onboarding gating, then a Home · [camera FAB] · History tab bar, with Camera & Settings as modal/card stack screens
- **Zustand** — `useAuthStore`, `useCalorieStore`
- **Supabase** — Auth + Postgres + Row Level Security
- **expo-secure-store** — encrypted session storage (Keychain / EncryptedSharedPreferences)
- **expo-camera / expo-image-picker / expo-image-manipulator** — capture + client-side downscale
- **expo-file-system** — binary (BINARY_CONTENT) upload of the JPEG to the webhook
- **n8n + Google Gemini** image-scan webhook

## Getting started
```bash
npm install
cp .env.example .env   # fill in your values (already set for the dev project)
npm start              # then press i / a, or scan the QR with Expo Go
```

### Environment (`.env`, `EXPO_PUBLIC_*` only — never service-role keys)
| Var | Purpose |
|-----|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key |
| `EXPO_PUBLIC_WEBHOOK_URL` | n8n `track-calories` webhook (self-hosted: `https://pen8n.online/webhook/track-calories`) |

## Project layout
```
src/
├── lib/            supabase client, env config
├── navigation/     RootNavigator (session/profile gating) + TabNavigator + types
├── store/          Zustand stores
├── screens/        Auth, Onboarding, Home, History, Camera, Settings
├── components/     CalorieRing, LogItem, MetricInput, AppButton, Segmented,
│                   BrandLogo, InfoBox, LabeledField
├── utils/          calorieCalculator, imageUpload, parseScan, date (+ tests)
└── types/          generated DB types + domain models
supabase/migrations/  SQL applied to the project (schema, RLS, RPCs)
```

## Food scan flow
Camera/gallery → downscale to JPEG → **POST raw bytes with `Content-Type: image/jpeg`**
to the self-hosted n8n webhook (`https://pen8n.online/webhook/track-calories`, 35s
timeout) → Gemini analyzes the image (the Gemini node has retry-on-fail enabled to
ride out transient `503` overload responses) → an n8n
`Format Response` Code node unwraps Gemini's envelope and the webhook returns a
clean contract `{ items, totalCalories, totalProtein, confidence, notes }` (each
item carries `estimatedCalories` + `estimatedProtein`) → `src/utils/parseScan.ts`
normalizes it into `{ foodName, calories, protein, confidence, items, notes }`
(kept as a defensive layer that also still tolerates the old raw shape, defaulting
protein to `0`) → logged via the `add_food_entry` RPC. Sending
`application/octet-stream` will fail — Gemini rejects that MIME type.

## Database
Three tables (`user_profiles`, `daily_logs`, `food_entries`) with RLS so each
user can only access their own rows. Each food entry stores `calories` and
`protein` (grams). Writes go through SECURITY DEFINER RPCs
(`get_or_create_log`, `add_food_entry`, `delete_food_entry`) that recompute
`total_consumed` from the entries. Daily protein is summed client-side (no
`daily_logs` protein column). See `supabase/migrations/`.

## Tests
```bash
npm test        # jest — calorie calculation + scan-response parsing
npx tsc --noEmit
```

## Not yet implemented (follow-ups)
- Google / Apple OAuth (email/password is wired up now)
