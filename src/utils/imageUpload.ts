import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";

import { ENV, WEBHOOK_TIMEOUT_MS } from "../lib/env";
import type { ScanResult } from "../types/models";
import { parseScanResult } from "./parseScan";

/**
 * Downscale + compress a captured/picked image before upload to cut latency and
 * data usage (PRD §5). Returns a new local file URI (JPEG).
 */
export async function compressImage(uri: string): Promise<string> {
  const result = await manipulateAsync(uri, [{ resize: { width: 1024 } }], {
    compress: 0.6,
    format: SaveFormat.JPEG,
  });
  return result.uri;
}

export class WebhookTimeoutError extends Error {
  constructor() {
    super("The scan timed out. Check your connection and try again.");
    this.name = "WebhookTimeoutError";
  }
}


/**
 * Upload the compressed JPEG to the n8n scan webhook as raw binary, with a hard
 * 15s timeout (PRD §5). Uses expo-file-system's BINARY_CONTENT upload (reliable
 * on-device, unlike fetch+Blob) and sends Content-Type: image/jpeg so Gemini
 * accepts the image (it rejects application/octet-stream).
 * Throws WebhookTimeoutError on timeout.
 */
export async function uploadFoodImage(uri: string): Promise<ScanResult> {
  const compressedUri = await compressImage(uri);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new WebhookTimeoutError()), WEBHOOK_TIMEOUT_MS);
  });

  try {
    const upload = FileSystem.uploadAsync(ENV.webhookUrl, compressedUri, {
      httpMethod: "POST",
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: { "Content-Type": "image/jpeg" },
    });

    const res = await Promise.race([upload, timeout]);

    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Scan service responded with ${res.status}`);
    }

    return parseScanResult(JSON.parse(res.body));
  } finally {
    if (timer) clearTimeout(timer);
  }
}
