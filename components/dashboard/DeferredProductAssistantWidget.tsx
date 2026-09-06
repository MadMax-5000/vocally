"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ProductAssistantWidget = dynamic(
  () =>
    import("@/components/dashboard/ProductAssistantWidget").then(
      (mod) => mod.ProductAssistantWidget
    ),
  { ssr: false }
);

export function DeferredProductAssistantWidget() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (
        cb: IdleRequestCallback,
        opts?: IdleRequestOptions
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let idleId = 0;
    let timeoutId = 0;

    const arm = () => {
      if (typeof win.requestIdleCallback === "function") {
        idleId = win.requestIdleCallback(() => setReady(true), { timeout: 2500 });
        return;
      }
      timeoutId = window.setTimeout(() => setReady(true), 200);
    };

    if (document.readyState === "complete") {
      arm();
    } else {
      window.addEventListener("load", arm, { once: true });
    }

    return () => {
      window.removeEventListener("load", arm);
      if (idleId && win.cancelIdleCallback) win.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) return null;
  return <ProductAssistantWidget />;
}
