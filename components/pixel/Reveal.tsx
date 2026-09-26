"use client";

import { cn } from "@/lib/utils";
import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";

/**
 * Steps content into place the first time it scrolls into view. The
 * resting style is fully visible, so reduced motion (and a failsafe for
 * slow scripts) simply shows it.
 */
export default function Reveal({
  children,
  className,
  delay = 0,
  style,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-revealed={shown ? "" : undefined}
      className={cn("reveal", className)}
      style={{ "--d": `${delay}ms`, ...style } as CSSProperties}
    >
      {children}
    </div>
  );
}

/** Counts up to `target` in chunky steps once `start` turns true. */
export function useCountUp(target: number, start: boolean, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const begin = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - begin) / duration);
      // Eight visible steps, like an odometer ticking over.
      setValue(Math.round((Math.floor(t * 8) / 8) * target));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, duration]);
  return value;
}

/** True once the element has been on screen. */
export function useSeen<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setSeen(true);
      observer.disconnect();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, seen] as const;
}
