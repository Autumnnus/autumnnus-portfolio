"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface Leaf {
  id: number;
  left: number;
  delay: number;
  duration: number;
  emoji: string;
}

const leafEmojis = ["🍂", "🍁", "🍃", "🌰"];
const snowEmojis = ["❄️", "🌨️", "❅", "❆"];

export default function FallingLeaves() {
  const [leaves, setLeaves] = useState<Leaf[]>([]);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const emojis = resolvedTheme === "dark" ? snowEmojis : leafEmojis;

    const newLeaves: Leaf[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 4,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    setLeaves(newLeaves);
  }, [resolvedTheme]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {leaves.map((leaf) => (
        <span
          key={leaf.id}
          className="absolute text-2xl opacity-60"
          style={{
            left: `${leaf.left}%`,
            top: "-40px",
            animation: `leafFall ${leaf.duration}s linear ${leaf.delay}s infinite`,
          }}
        >
          {leaf.emoji}
        </span>
      ))}
    </div>
  );
}
