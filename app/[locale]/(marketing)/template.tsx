"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function MarketingTemplate({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="w-full flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
}
