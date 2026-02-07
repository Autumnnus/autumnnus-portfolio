"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="pixel-btn p-2" aria-label="Toggle theme">
        <span className="opacity-0">Theme</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="pixel-btn p-2 hover:bg-secondary/20 transition-colors flex items-center justify-center"
      aria-label="Toggle theme"
      title={resolvedTheme === "dark" ? "Kış -> Sonbahar" : "Sonbahar -> Kış"}
    >
      {resolvedTheme === "dark" ? (
        <div className="flex items-center gap-2">
          <span>❄️</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span>🍂</span>
        </div>
      )}
    </button>
  );
}
