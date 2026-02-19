"use client";

import { trackVisitor } from "@/app/actions";
import { useEffect } from "react";

export default function VisitorTracker() {
  useEffect(() => {
    trackVisitor().catch((err) =>
      console.error("Failed to track visitor:", err),
    );
  }, []);

  return null;
}
