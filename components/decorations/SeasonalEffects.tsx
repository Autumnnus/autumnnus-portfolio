"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Snowfall from "react-snowfall";

const leafEmojis = ["🍂", "🍁", "🍃", "🌰"];

const createEmojiImage = (emoji: string) => {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 40;
  canvas.height = 40;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.font = "30px serif";
  ctx.fillText(emoji, 5, 30);
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
};

export default function SeasonalEffects() {
  const { resolvedTheme } = useTheme();
  const [state, setState] = useState({
    mounted: false,
    leafImages: [] as HTMLImageElement[],
  });

  useEffect(() => {
    const images = leafEmojis
      .map(createEmojiImage)
      .filter((img): img is HTMLImageElement => img !== null);

    const timer = setTimeout(() => {
      setState({
        mounted: true,
        leafImages: images,
      });
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  if (!state.mounted) return null;

  const isWinter = resolvedTheme === "dark";

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <AnimatePresence mode="wait">
        {isWinter ? (
          <motion.div
            key="winter"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.8 } }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Snowfall
              snowflakeCount={100}
              color="#e0f7fa"
              style={{
                position: "fixed",
                width: "100vw",
                height: "100vh",
              }}
              wind={[-0.5, 2]}
              radius={[0.5, 3.0]}
              speed={[1, 3]}
            />
          </motion.div>
        ) : (
          <motion.div
            key="autumn"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.8 } }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {state.leafImages.length > 0 && (
              <Snowfall
                snowflakeCount={40}
                images={state.leafImages}
                style={{
                  position: "fixed",
                  width: "100vw",
                  height: "100vh",
                }}
                radius={[10, 20]}
                wind={[-1, 3]}
                speed={[1.5, 4]}
                rotationSpeed={[-1, 1]}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
