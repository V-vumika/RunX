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
});
