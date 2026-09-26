"use client";

import { useEffect, useRef } from "react";
import { typingSparks } from "./typing-events";

/**
 * The leaf quill: while an answer is being written, a little pixel quill
 * rides the end of the text and every letter kicks up leaves (autumn) or
 * frost (winter). When the answer is done the quill flourishes and bursts.
 * One canvas overlays the message list; it only animates while needed.
 */
const PX = 2;
const QUILL = [
  "....##",
  "...###",
  "..###.",
  ".###..",
  ".s#...",
  "s.....",
];
const COLORS = {
  autumn: { quill: "#e0692e", stem: "#2a1a12", sparks: ["#e0692e", "#e8b040", "#c23b22", "#f5a07e"] },
  winter: { quill: "#8fd8f2", stem: "#ffffff", sparks: ["#ffffff", "#8fd8f2", "#c9e9ff", "#b9a7ff"] },
};

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  color: string;
  shape: 0 | 1 | 2;
}

interface Caret {
  x: number;
  y: number;
}

/** Bottom-right of the last written character, relative to `host`. */
function caretOf(el: HTMLElement, host: DOMRect): Caret | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let last: Text | null = null;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node.data.trim()) last = node;
  }
  if (!last) return null;
  const end = last.data.trimEnd().length;
  if (!end) return null;
  const range = document.createRange();
  range.setStart(last, end - 1);
  range.setEnd(last, end);
  const rects = range.getClientRects();
  const rect = rects[rects.length - 1];
  if (!rect) return null;
  return { x: rect.right - host.left, y: rect.bottom - host.top - 3 };
}

export default function TypingSparks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let sparks: Spark[] = [];
    let writer: HTMLElement | null = null;
    let lastType = 0;
    let raf = 0;
    let last = 0;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    const palette = () =>
      COLORS[document.documentElement.classList.contains("dark") ? "winter" : "autumn"];

    const spawn = (at: Caret, count: number, burst: boolean) => {
      const colors = palette().sparks;
      for (let i = 0; i < count; i++) {
        const angle = burst
          ? Math.random() * Math.PI * 2
          : -Math.PI / 2 + (Math.random() - 0.3) * 1.6;
        const speed = burst ? 70 + Math.random() * 110 : 50 + Math.random() * 90;
        sparks.push({
          x: at.x + 4,
          y: at.y - 4,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          age: 0,
          life: 0.45 + Math.random() * 0.4 + (burst ? 0.25 : 0),
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: (Math.floor(Math.random() * 3) as 0 | 1 | 2),
        });
      }
      if (sparks.length > 160) sparks = sparks.slice(-160);
    };

    const block = (x: number, y: number) =>
      ctx.fillRect(Math.round(x / PX) * PX, Math.round(y / PX) * PX, PX, PX);

    const drawQuill = (at: Caret, now: number) => {
      const { quill, stem } = palette();
      const writing = now - lastType < 160;
      const lift = writing && Math.floor(now / 90) % 2 === 0 ? -PX : 0;
      const ox = at.x + 1;
      const oy = at.y - QUILL.length * PX + PX + lift;
      QUILL.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const cell = row[x];
          if (cell === ".") continue;
          ctx.fillStyle = cell === "s" ? stem : quill;
          block(ox + x * PX, oy + y * PX);
        }
      });
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const hostRect = host.getBoundingClientRect();
      ctx.clearRect(0, 0, hostRect.width, hostRect.height);

      sparks = sparks.filter((s) => {
        s.age += dt;
        s.vy += 320 * dt;
        s.vx *= 1 - dt * 1.5;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        return s.age < s.life;
      });
      for (const s of sparks) {
        // Flicker out over the last third of a spark's life.
        if (s.age > s.life * 0.66 && Math.floor(s.age * 30) % 2 === 0) continue;
        ctx.fillStyle = s.color;
        block(s.x, s.y);
        if (s.shape === 1) block(s.x + PX, s.y);
        if (s.shape === 2) {
          block(s.x + PX, s.y);
          block(s.x, s.y + PX);
        }
      }

      const caret = writer?.isConnected ? caretOf(writer, hostRect) : null;
      if (caret) drawQuill(caret, now);

      if (sparks.length || writer) {
        raf = requestAnimationFrame(frame);
      } else {
        raf = 0;
      }
    };

    const wake = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const unsubscribe = typingSparks.subscribe((event) => {
      if (!host.contains(event.el)) return;
      const caret = caretOf(event.el, host.getBoundingClientRect());
      if (event.kind === "type") {
        writer = event.el;
        lastType = performance.now();
        if (caret) spawn(caret, Math.min(3, 1 + Math.floor(event.count / 3)), false);
      } else {
        writer = null;
        if (caret) spawn(caret, 18, true);
      }
      wake();
    });

    return () => {
      unsubscribe();
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10"
    />
  );
}
