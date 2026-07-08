/**
 * Shareable-trace links.
 *
 * A run is fully reproducible from its source + stdin, so we pack those into a
 * URL-safe base64 token that rides in the URL hash (`#s=…`). Everything stays
 * client-side — no server, no storage — and opening the link restores the code
 * and stdin into the editor. UTF-8 safe (handles non-ASCII source).
 */

export interface SharePayload {
  code: string;
  stdin?: string;
}

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

/** Pack source (+ optional stdin) into a URL-safe token. */
export function encodeShare(p: SharePayload): string {
  const obj: { c: string; i?: string } = { c: p.code };
  if (p.stdin) obj.i = p.stdin;
  return toB64Url(JSON.stringify(obj));
}

/** Recover a payload from a token, or null when it's missing/corrupt. */
export function decodeShare(token: string): SharePayload | null {
  try {
    const obj = JSON.parse(fromB64Url(token));
    if (typeof obj?.c !== "string") return null;
    return { code: obj.c, stdin: typeof obj.i === "string" ? obj.i : undefined };
  } catch {
    return null;
  }
}
