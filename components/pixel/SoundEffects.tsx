"use client";

import { playSound, primeSound } from "@/lib/pixel/sound";
import { useEffect } from "react";

/**
 * One delegated listener gives every link and button a press blip, so
 * individual components don't need to know about sound at all.
 */
export default function SoundEffects() {
  useEffect(() => {
    primeSound();
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest("a[href], button:not(:disabled)")) playSound("click");
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return null;
}
