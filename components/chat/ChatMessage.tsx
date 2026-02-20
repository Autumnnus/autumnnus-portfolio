"use client";

import { type SourceItem } from "@/app/api/chat/route";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { SourceList } from "./SourceCard";

export type MessageRole = "user" | "ai";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  sources?: SourceItem[];
}

interface ChatMessageProps {
  message: Message;
  userImage?: string;
  aiImage?: string;
}

export function ChatMessage({ message, userImage, aiImage }: ChatMessageProps) {
  const isUser = message.role === "user";
  const avatarImage = isUser ? userImage : aiImage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      className={cn(
        "flex w-full gap-3 p-2 items-start",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <Avatar className="h-10 w-10 shrink-0 border shadow-sm">
        <AvatarImage src={avatarImage} alt={isUser ? "User" : "AI"} />
        <AvatarFallback
          className={cn(
            "text-xs font-bold",
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
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "flex flex-col gap-1 rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-colors",
          isUser
            ? "max-w-[85%] bg-primary text-primary-foreground rounded-tr-sm"
            : "w-full max-w-[85%] bg-muted/80 backdrop-blur-sm border border-border/50 text-foreground rounded-tl-sm shadow-inner",
        )}
      >
        <div className="prose prose-sm dark:prose-invert wrap-break-word max-w-none prose-p:leading-relaxed prose-pre:bg-black/10 dark:prose-pre:bg-white/10 prose-pre:rounded-lg">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <SourceList sources={message.sources} />
        )}

        <span className="text-[10px] opacity-70 self-end font-medium mt-1">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </motion.div>
  );
}

export function ChatLoading({ aiImage }: { aiImage?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full gap-3 p-2 items-start"
    >
      <Avatar className="h-8 w-8 shrink-0 border shadow-sm">
        <AvatarImage src={aiImage} alt="AI" />
        <AvatarFallback className="bg-muted text-muted-foreground">
          <Sparkles className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-muted/80 backdrop-blur-sm border border-border/50 px-4 py-3 text-sm shadow-sm">
        <span className="flex gap-1">
          <motion.span
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            className="h-1.5 w-1.5 rounded-full bg-primary/60"
          />
          <motion.span
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            className="h-1.5 w-1.5 rounded-full bg-primary/60"
          />
          <motion.span
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            className="h-1.5 w-1.5 rounded-full bg-primary/60"
          />
        </span>
      </div>
    </motion.div>
  );
}
