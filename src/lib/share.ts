/**
 * Shareable-trace links.
 *
 * A run is fully reproducible from its source + stdin (+ language), so we pack
 * those into a URL-safe base64 token that rides in the URL hash (`#s=…`).
 * Everything stays client-side — no server, no storage — and opening the link
 * restores the code, stdin, and language into the editor. UTF-8 safe (handles
 * non-ASCII source). Links from before the language field default to Python.
 */

import type { Language } from "@/lib/execution/entry";

export interface SharePayload {
  code: string;
  stdin?: string;
  language?: Language;
}

/** Languages a share link may name — anything else is ignored on decode. */
const SHARE_LANGUAGES: ReadonlySet<string> = new Set(["python", "javascript"]);

function toB64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Pack source (+ optional stdin/language) into a URL-safe token. */
export function encodeShare(p: SharePayload): string {
  const obj: { c: string; i?: string; l?: string } = { c: p.code };
  if (p.stdin) obj.i = p.stdin;
  // Python is the default on load, so only non-Python needs encoding.
  if (p.language && p.language !== "python") obj.l = p.language;
  return toB64Url(JSON.stringify(obj));
}

/** Recover a payload from a token, or null when it's missing/corrupt. */
export function decodeShare(token: string): SharePayload | null {
  try {
    const obj = JSON.parse(fromB64Url(token));
    if (typeof obj?.c !== "string") return null;
    return {
      code: obj.c,
      stdin: typeof obj.i === "string" ? obj.i : undefined,
      language: SHARE_LANGUAGES.has(obj.l) ? (obj.l as Language) : undefined,
    };
  } catch {
    return null;
  }
}
