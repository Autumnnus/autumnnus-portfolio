"use client";

import { playSound } from "@/lib/pixel/sound";
import { useEffect, useRef, useState } from "react";

/**
 * Hide markdown that is only half written, so a streaming answer never
 * flashes raw `[label](cite:…` or a lone `**`.
 */
function safeSlice(text: string, count: number) {
  if (count >= text.length) return text;
  let out = text.slice(0, count);
  const open = out.lastIndexOf("[");
  if (open !== -1 && !/\]\([^)]*\)/.test(out.slice(open))) out = out.slice(0, open);
  if ((out.match(/\*\*/g)?.length ?? 0) % 2 === 1) {
    out = out.slice(0, out.lastIndexOf("**"));
  }
  if ((out.match(/`/g)?.length ?? 0) % 2 === 1) {
    out = out.slice(0, out.lastIndexOf("`"));
  }
  return out;
}

/**
 * RPG-dialogue reveal for a streaming answer: characters come out at a
 * steady pace that speeds up when the stream runs ahead, with a soft blip.
 * Messages that were never live (restored history) show in full at once.
 */
export function useTypewriter(text: string, streaming: boolean) {
  const [live, setLive] = useState(
    () =>
      streaming &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [shown, setShown] = useState(0);
  const textRef = useRef(text);
  const streamingRef = useRef(streaming);
  const shownRef = useRef(0);

  useEffect(() => {
    textRef.current = text;
    streamingRef.current = streaming;
  });

  useEffect(() => {
    if (!live) return;
    let raf = 0;
    let last = performance.now();
    let lastBlip = 0;
    const tick = (now: number) => {
      const target = textRef.current.length;
      if (shownRef.current < target) {
        const backlog = target - shownRef.current;
        // Keep an RPG pace, catching up when the stream runs far ahead.
        const perSecond = Math.min(360, Math.max(50, backlog * 2.5));
        const step = Math.max(1, Math.round((perSecond * (now - last)) / 1000));
        shownRef.current = Math.min(target, shownRef.current + step);
        setShown(shownRef.current);
        if (now - lastBlip > 90) {
          playSound("type");
          lastBlip = now;
        }
      } else if (!streamingRef.current) {
        setLive(false);
        return;
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live]);

  if (!live) return { text, revealing: false };
  return { text: safeSlice(text, shown), revealing: shown < text.length };
}
