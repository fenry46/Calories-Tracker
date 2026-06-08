import { ENV, WEBHOOK_TIMEOUT_MS } from "../lib/env";
import type { ScanResult } from "../types/models";
import { parseScanResult } from "./parseScan";
import { WebhookTimeoutError } from "./imageUpload";

/**
 * Re-estimate calories from an edited text description via the n8n text webhook.
 * Sends JSON `{description}` and returns the same normalized ScanResult shape as
 * an image scan (the webhook's Format Response emits the identical clean
 * contract). Throws WebhookTimeoutError on timeout.
 *
 * Unlike the image upload, a plain `fetch` is fine here — there's no binary body
 * to mangle, so we don't need expo-file-system.
 */
export async function estimateFromText(description: string): Promise<ScanResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const res = await fetch(ENV.webhookTextUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: description.trim() }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Scan service responded with ${res.status}`);
    }

    return parseScanResult(await res.json());
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new WebhookTimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
