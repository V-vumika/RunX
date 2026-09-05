"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useExecutionStore } from "@/lib/store/execution-store";
import { encodeShare } from "@/lib/share";

/**
 * Copies a shareable link to the current code + stdin. The whole run is encoded
 * in the URL hash (see `lib/share.ts`) — no backend — and the address bar is
 * updated in place so a plain copy also works.
 */
export function ShareButton() {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  const share = async () => {
    const { code, stdin, language } = useExecutionStore.getState();
    const token = encodeShare({ code, stdin, language });
    const url = `${location.origin}${location.pathname}#s=${token}`;
    history.replaceState(null, "", url);

    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(url);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }

    setTimeout(() => setCopyStatus("idle"), 1800);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={share}
      title="Copy a link to this code"
      aria-live="polite"
    >
      {copyStatus === "copied" ? <Check className="size-4 text-emerald-500" /> : <Share2 className="size-4" />}
      {copyStatus === "copied" ? "Copied!" : copyStatus === "failed" ? "Copy failed" : "Share"}
    </Button>
  );
}
