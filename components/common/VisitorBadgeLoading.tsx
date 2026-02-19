"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function VisitorBadgeLoading() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-secondary/10 border-2 border-border/20 shadow-sm w-48 h-[52px]">
      {/* Background Pulse */}
      <motion.div
        className="absolute inset-0 bg-primary/5"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Shimmer Effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)`,
        }}
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative flex items-center gap-3 px-4 py-2.5 h-full">
        {/* Icon Placeholder */}
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-border/20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-4 h-4 text-muted-foreground/50" />
          </motion.div>
        </div>

        {/* Text Placeholders */}
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="h-2.5 w-16 bg-border/20 rounded-full" />
          <div className="h-2 w-20 bg-border/10 rounded-full" />
        </div>

        {/* Tier Badge Placeholder */}
        <div className="h-4 w-12 bg-border/10 rounded-full ml-1" />
      </div>
    </div>
  );
}
