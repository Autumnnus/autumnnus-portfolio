"use client";

import { cn } from "@/lib/utils";
import { Loader2, Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

export type MessageRole = "user" | "ai";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3 p-4",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1 rounded-lg px-3 py-2 text-sm shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        <div className="prose prose-sm dark:prose-invert break-words">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        <span className="text-[10px] opacity-50 self-end">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

export function ChatLoading() {
  return (
    <div className="flex w-full gap-3 p-4">
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-muted text-muted-foreground shadow">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-sm shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs text-muted-foreground">Typing...</span>
      </div>
    </div>
  );
}
