"use client";

import { getUserAction, toggleCommentAction } from "@/lib/storage";
import { getRelativeTime } from "@/lib/utils";
import { Comment as CommentType, User } from "@/types/blog";
import * as Avatar from "@radix-ui/react-avatar";
import { MessageSquare, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

interface CommentProps {
  comment: CommentType;
  user: User | null;
  onReply?: (commentId: string) => void;
}

// Sample user data for demo
const sampleUsers: Record<string, { name: string; username: string }> = {
  "sample-user-1": { name: "Akshit Sachdeva", username: "@akshit.akdanger" },
  "sample-user-2": { name: "Shubh Ujala", username: "@shubhujala.code" },
  "sample-user-3": { name: "Prateek Dwivedi", username: "@dprateek776" },
};

export default function CommentComponent({
  comment,
  user,
  onReply,
}: CommentProps) {
  const [likes, setLikes] = useState(comment.likes);
  const [dislikes, setDislikes] = useState(comment.dislikes);
  const [userAction, setUserAction] = useState<"like" | "dislike" | null>(
    getUserAction(comment.id),
  );

  const commentUser = sampleUsers[comment.userId] ||
    user || { name: "Anonymous", username: "" };

  const handleAction = (type: "like" | "dislike") => {
    toggleCommentAction(comment.id, type);

    if (userAction === type) {
      // Remove action
      setUserAction(null);
      if (type === "like") {
        setLikes(likes - 1);
      } else {
        setDislikes(dislikes - 1);
      }
    } else if (userAction) {
      // Switch action
      if (type === "like") {
        setLikes(likes + 1);
        setDislikes(dislikes - 1);
      } else {
        setDislikes(dislikes + 1);
        setLikes(likes - 1);
      }
      setUserAction(type);
    } else {
      // New action
      if (type === "like") {
        setLikes(likes + 1);
      } else {
        setDislikes(dislikes + 1);
      }
      setUserAction(type);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="py-4">
      <div className="flex gap-4">
        {/* Avatar */}
        <Avatar.Root className="flex-shrink-0">
          <Avatar.Fallback className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            {getInitials(commentUser.name)}
          </Avatar.Fallback>
        </Avatar.Root>

        {/* Content */}
        <div className="flex-1 space-y-2">
          {/* User Info */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{commentUser.name}</span>
            {commentUser.username && (
              <span className="text-muted-foreground text-xs">
                {commentUser.username}
              </span>
            )}
            <span className="text-muted-foreground text-xs">
              {getRelativeTime(comment.createdAt)}
            </span>
          </div>

          {/* Comment Text */}
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-1">
            {/* Like */}
            <button
              onClick={() => handleAction("like")}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                userAction === "like"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              {likes > 0 && <span>{likes}</span>}
            </button>

            {/* Dislike */}
            <button
              onClick={() => handleAction("dislike")}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                userAction === "dislike"
                  ? "text-destructive"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
              {dislikes > 0 && <span>{dislikes}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Replies indicator */}
      {comment.replies && comment.replies.length > 0 && (
        <button
          onClick={() => onReply?.(comment.id)}
          className="ml-14 mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <MessageSquare className="w-3 h-3" />
          {comment.replies.length}{" "}
          {comment.replies.length === 1 ? "reply" : "replies"}
        </button>
      )}
    </div>
  );
}
