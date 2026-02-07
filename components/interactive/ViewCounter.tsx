"use strict";
"use client";

import { CommentItemType, incrementView } from "@/app/actions";
import { Eye } from "lucide-react";
import { useEffect, useState } from "react";

interface ViewCounterProps {
  itemId: string;
  itemType: CommentItemType;
  initialViews?: number;
}

export default function ViewCounter({
  itemId,
  itemType,
  initialViews = 0,
}: ViewCounterProps) {
  const [views, setViews] = useState(initialViews);
  const [hasRecorded, setHasRecorded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function recordView() {
      if (hasRecorded) return;

      try {
        const result = await incrementView(itemId, itemType);
        if (mounted && result.success && typeof result.count === "number") {
          setViews(result.count);
          setHasRecorded(true);
        }
      } catch (error) {
        console.error("Failed to record view:", error);
      }
    }

    recordView();

    return () => {
      mounted = false;
    };
  }, [itemId, itemType, hasRecorded]);

  return (
    <div
      className="flex items-center gap-1 text-sm text-muted-foreground"
      title="Views"
    >
      <Eye className="w-4 h-4" />
      <span>{views}</span>
    </div>
  );
}
