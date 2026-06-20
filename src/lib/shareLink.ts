import type { TripState } from "@/lib/types";

function toBase64(json: string): string {
  if (typeof btoa !== "undefined") {
    return btoa(unescape(encodeURIComponent(json)));
  }
  return Buffer.from(json, "utf8").toString("base64");
}

function fromBase64(b64: string): string {
  if (typeof atob !== "undefined") {
    return decodeURIComponent(escape(atob(b64)));
  }
  return Buffer.from(b64, "base64").toString("utf8");
}

/** Serializes a TripState into a URL-safe base64 string for shareable links. */
export function encodeTripState(state: TripState): string {
  return toBase64(JSON.stringify(state))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Decodes a shared link payload back into a TripState, or null if invalid. */
export function decodeTripState(encoded: string): TripState | null {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(fromBase64(b64)) as TripState;
  } catch {
    return null;
  }
}
