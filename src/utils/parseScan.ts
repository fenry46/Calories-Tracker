import type { ScanItem, ScanResult } from "../types/models";

/** Raw JSON the Gemini prompt is instructed to produce. */
interface GeminiPayload {
  items?: ScanItem[];
  totalCalories?: number;
  confidence?: "low" | "medium" | "high" | number;
  notes?: string;
}

const CONFIDENCE_MAP: Record<string, number> = { low: 0.4, medium: 0.7, high: 0.95 };

/**
 * The webhook responds with Gemini's raw output, which wraps the actual JSON as
 * a string at [0].content.parts[0].text. Dig that string out as robustly as we
 * can, tolerating either the wrapped array, a bare object, or a plain string.
 */
export function extractPayloadText(data: unknown): string {
  const candidate = Array.isArray(data) ? data[0] : data;
  const partText = (candidate as any)?.content?.parts?.[0]?.text;
  if (typeof partText === "string") return partText;
  if (candidate && typeof candidate === "object") return JSON.stringify(candidate);
  if (typeof data === "string") return data;
  return "";
}

/** Flatten the webhook's raw response into the stable ScanResult shape. */
export function parseScanResult(data: unknown): ScanResult {
  const raw = extractPayloadText(data)
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  let payload: GeminiPayload = {};
  try {
    payload = JSON.parse(raw) as GeminiPayload;
  } catch {
    // leave payload empty -> treated as "nothing detected" by the caller
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  const calories =
    typeof payload.totalCalories === "number"
      ? payload.totalCalories
      : items.reduce((sum, it) => sum + (Number(it.estimatedCalories) || 0), 0);

  const confidence =
    typeof payload.confidence === "number"
      ? payload.confidence
      : CONFIDENCE_MAP[String(payload.confidence)] ?? 0.5;

  const foodName =
    items.length > 0 ? items.map((it) => it.name).filter(Boolean).join(", ") : "";

  return {
    foodName,
    calories: Math.round(calories),
    confidence,
    items,
    notes: payload.notes ?? "",
  };
}
