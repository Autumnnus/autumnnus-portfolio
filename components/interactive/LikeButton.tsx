"use client";

import { CommentItemType, getLikeStatus, toggleLike } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

interface LikeButtonProps {
  itemId: string;
  itemType: CommentItemType;
  initialLikes?: number;
}

export default function LikeButton({
  itemId,
  itemType,
  initialLikes = 0,
}: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchStatus() {
      try {
        const status = await getLikeStatus(itemId, itemType);
        if (mounted) {
          setLiked(status.liked);
          setLikes(status.count); // Sync with server count on load
        }
      } catch (error) {
        console.error("Failed to fetch like status:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchStatus();

    return () => {
      mounted = false;
    };
  }, [itemId, itemType]);

  const handleToggleLike = async () => {
    // Optimistic update
    const previousLiked = liked;
    const previousLikes = likes;

    setLiked(!previousLiked);
    setLikes(previousLiked ? previousLikes - 1 : previousLikes + 1);

    try {
      const result = await toggleLike(itemId, itemType);
      if (result.success && typeof result.liked === "boolean") {
        setLiked(result.liked);
        if (typeof result.count === "number") {
          setLikes(result.count);
        }
      } else {
        // Revert on failure
        setLiked(previousLiked);
        setLikes(previousLikes);
        console.error(result.error);
      }
    } catch (error) {
      setLiked(previousLiked);
      setLikes(previousLikes);
      console.error("Failed to toggle like:", error);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`flex items-center gap-1 ${
        liked
          ? "text-red-500 hover:text-red-600"
          : "text-muted-foreground hover:text-foreground"
      }`}
      onClick={handleToggleLike}
      disabled={isLoading}
      title={liked ? "Unlike" : "Like"}
    >
      <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
      <span>{likes}</span>
    </Button>
  );
}
