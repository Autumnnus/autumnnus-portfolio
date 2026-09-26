"use client";

import { PixelGrid } from "@/components/pixel/PixelIcon";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

/**
 * Autumn, the assistant's face: a 12×12 leaf that blinks when idle, looks up
 * while thinking and moves its mouth while its answer is being written.
 *   # body (currentColor)  e eyes/mouth  s stem  c cheeks  h highlight
 */
const FRAMES = {
  idle: [
    "......ss....",
    ".....s......",
    "...######...",
    "..#h######..",
    ".#h########.",
    ".##e####e##.",
    ".##e####e##.",
    ".#c#e##e#c#.",
    ".####ee####.",
    "..########..",
    "...######...",
    ".....##.....",
  ],
  blink: [
    "......ss....",
    ".....s......",
    "...######...",
    "..#h######..",
    ".#h########.",
    ".##########.",
    ".##e####e##.",
    ".#c#e##e#c#.",
    ".####ee####.",
    "..########..",
    "...######...",
    ".....##.....",
  ],
  talkOpen: [
    "......ss....",
    ".....s......",
    "...######...",
    "..#h######..",
    ".#h########.",
    ".##e####e##.",
    ".##e####e##.",
    ".#c######c#.",
    ".####ee####.",
    "..###ee###..",
    "...######...",
    ".....##.....",
  ],
  talkClosed: [
    "......ss....",
    ".....s......",
    "...######...",
    "..#h######..",
    ".#h########.",
    ".##e####e##.",
    ".##e####e##.",
    ".#c######c#.",
    ".####ee####.",
    "..########..",
    "...######...",
    ".....##.....",
  ],
  think: [
    "......ss....",
    ".....s......",
    "...######...",
    "..#h######..",
    ".#h#e####e#.",
    ".###e####e#.",
    ".##########.",
    ".#c######c#.",
    ".######e###.",
    "..########..",
    "...######...",
    ".....##.....",
  ],
};

const PALETTE = {
  e: "var(--px-ink)",
  s: "var(--px-ink)",
  c: "var(--cheek)",
  h: "rgb(255 255 255 / 0.45)",
};

export type MascotMood = "idle" | "talk" | "think";

export default function AutumnMascot({
  mood = "idle",
  className,
}: {
  mood?: MascotMood;
  className?: string;
}) {
  const [blink, setBlink] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          setBlink(true);
          timer = setTimeout(() => {
            setBlink(false);
            schedule();
          }, 130);
        },
        2400 + Math.random() * 2600,
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mood !== "talk") return;
    const id = setInterval(() => setMouthOpen((open) => !open), 130);
    return () => clearInterval(id);
  }, [mood]);

  const grid =
    mood === "think"
      ? FRAMES.think
      : mood === "talk"
        ? mouthOpen
          ? FRAMES.talkOpen
          : FRAMES.talkClosed
        : blink
          ? FRAMES.blink
          : FRAMES.idle;

  return (
    <PixelGrid
      grid={grid}
      palette={PALETTE}
      className={cn(
        "text-primary",
        mood === "think" && "mascot-think",
        mood === "talk" && "mascot-talk",
        className,
      )}
    />
  );
}
