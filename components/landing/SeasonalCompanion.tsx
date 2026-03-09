"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __seasonalCompanionCleanup?: () => void;
  }
}

export default function SeasonalCompanion() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/seasonal-companion/seasonal-companion.js?v=6";
    script.dataset.lightSprite = "/autumn/autumn.png";
    script.dataset.darkSprite = "/snow/snowman.png";

    document.body.appendChild(script);

    return () => {
      script.remove();
      window.__seasonalCompanionCleanup?.();
    };
  }, []);

  return null;
}
