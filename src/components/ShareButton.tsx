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
  const [copied, setCopied] = useState(false);

  const share = () => {
    const { code, stdin } = useExecutionStore.getState();
    const token = encodeShare({ code, stdin });
    const url = `${location.origin}${location.pathname}#s=${token}`;
    history.replaceState(null, "", url);
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={share} title="Copy a link to this code">
      {copied ? <Check className="size-4 text-emerald-500" /> : <Share2 className="size-4" />}
      {copied ? "Copied!" : "Share"}
    </Button>
  );
}
