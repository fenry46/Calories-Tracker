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

const webhookUrl = required(
  "EXPO_PUBLIC_WEBHOOK_URL",
  process.env.EXPO_PUBLIC_WEBHOOK_URL
);

export const ENV = {
  supabaseUrl: required(
    "EXPO_PUBLIC_SUPABASE_URL",
    process.env.EXPO_PUBLIC_SUPABASE_URL
  ),
  supabaseAnonKey: required(
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  ),
  /** Image-scan webhook (binary JPEG upload). */
  webhookUrl,
  /**
   * Text re-estimation webhook (JSON `{description}`). Defaults to the image
   * webhook's `/track-calories` sibling `/track-calories-text` so existing
   * `.env` files keep working; override with EXPO_PUBLIC_WEBHOOK_TEXT_URL.
   */
  webhookTextUrl:
    process.env.EXPO_PUBLIC_WEBHOOK_TEXT_URL ||
    webhookUrl.replace(/\/track-calories\b/, "/track-calories-text"),
} as const;

/**
 * Hard timeout for the n8n scan webhook. The PRD (§5) suggested 15s, but Gemini
 * 2.5-flash image analysis alone takes ~13-14s, and the budget must also cover
 * the image upload and response download — 15s times out on real scans. 35s
 * gives comfortable headroom while still failing fast on a dead connection.
 */
export const WEBHOOK_TIMEOUT_MS = 35_000;
