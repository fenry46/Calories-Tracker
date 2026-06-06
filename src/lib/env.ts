/**
 * Centralized, validated access to the public runtime config.
 * Only EXPO_PUBLIC_* vars are bundled into the client — never service-role keys.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Did you create a .env file (see .env.example)?`
    );
  }
  return value;
}

export const ENV = {
  supabaseUrl: required(
    "EXPO_PUBLIC_SUPABASE_URL",
    process.env.EXPO_PUBLIC_SUPABASE_URL
  ),
  supabaseAnonKey: required(
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  ),
  webhookUrl: required(
    "EXPO_PUBLIC_WEBHOOK_URL",
    process.env.EXPO_PUBLIC_WEBHOOK_URL
  ),
} as const;

/** Hard timeout for the n8n scan webhook (PRD §5: 15s). */
export const WEBHOOK_TIMEOUT_MS = 15_000;
