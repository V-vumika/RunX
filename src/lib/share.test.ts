import { describe, it, expect } from "vitest";
import { encodeShare, decodeShare } from "./share";

describe("share encode/decode", () => {
  it("round-trips code (and omits empty stdin)", () => {
    const token = encodeShare({ code: "print('hi')", stdin: "" });
    expect(decodeShare(token)).toEqual({ code: "print('hi')", stdin: undefined });
  });

  it("round-trips code + stdin", () => {
    const p = { code: "x = int(input())\nprint(x * 2)", stdin: "21\n" };
    expect(decodeShare(encodeShare(p))).toEqual(p);
  });

  it("survives non-ASCII source (UTF-8 safe)", () => {
    const p = { code: "s = 'café ☕ — π'\nprint(s)" };
    const back = decodeShare(encodeShare(p));
    expect(back?.code).toBe(p.code);
  });

  it("produces a URL-safe token (no +, /, =)", () => {
    const token = encodeShare({ code: "a" .repeat(200) });
    expect(token).not.toMatch(/[+/=]/);
  });

  it("returns null on a corrupt token", () => {
    expect(decodeShare("!!!not-base64!!!")).toBeNull();
    expect(decodeShare("")).toBeNull();
  });

  it("round-trips a non-Python language", () => {
    const token = encodeShare({ code: "console.log(1)", language: "javascript" });
    expect(decodeShare(token)?.language).toBe("javascript");
  });

  it("omits python (the default) and ignores unknown languages", () => {
    const py = decodeShare(encodeShare({ code: "print(1)", language: "python" }));
    expect(py?.language).toBeUndefined();
    // A forged/future token with an unknown language falls back to undefined.
    const forged = encodeShare({ code: "x" }).replace(/^/, "");
    expect(decodeShare(forged)?.language).toBeUndefined();
  });
});
