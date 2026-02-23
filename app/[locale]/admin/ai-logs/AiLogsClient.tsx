"use client";

import CodeBlock from "@/components/common/CodeBlock";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Info, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
  metadata: Record<string, unknown> | null;
};

export type Session = {
  id: string;
  ipAddress: string;
  updatedAt: Date;
  createdAt: Date;
  messages: Message[];
};

export default function AiLogsClient({ sessions }: { sessions: Session[] }) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    sessions.length > 0 ? sessions[0].id : null,
  );
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedSessionId, selectedSession?.messages]);

  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center border border-border/50 rounded-3xl bg-muted/20 text-muted-foreground p-12 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
          <Bot className="w-8 h-8 opacity-20" />
        </div>
        <p className="font-bold tracking-tight">No sessions found.</p>
        <p className="text-sm opacity-60">
          AI chat logs will appear here once they are generated.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden min-h-0 relative h-full">
      {/* Session List Column */}
      <div
        className={cn(
          "lg:w-80 border border-border/50 rounded-3xl flex flex-col overflow-hidden bg-muted/20 backdrop-blur-xl shrink-0 transition-all duration-300 z-30 shadow-sm",
          isSidebarOpen
            ? "fixed inset-4 lg:relative lg:inset-0"
            : "hidden lg:flex",
        )}
      >
        <div className="p-5 border-b border-border/50 font-bold text-xs uppercase tracking-widest text-primary flex justify-between items-center">
          <span>Sessions</span>
          <button
            className="lg:hidden p-2 hover:bg-primary/10 rounded-xl transition-all"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => {
                setSelectedSessionId(session.id);
                setSelectedMessage(null);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full text-left p-4 rounded-2xl transition-all hover:bg-primary/5 group",
                selectedSessionId === session.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-transparent text-foreground",
              )}
            >
              <div className="font-bold text-sm truncate flex items-center gap-2">
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    selectedSessionId === session.id
                      ? "bg-primary-foreground"
                      : "bg-primary",
                  )}
                />
                {session.ipAddress}
              </div>
              <div
                className={cn(
                  "text-[10px] mt-1 font-medium px-3.5",
                  selectedSessionId === session.id
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground",
                )}
                suppressHydrationWarning
              >
                {mounted && format(new Date(session.updatedAt), "PPp")}
              </div>
              <div
                className={cn(
                  "text-[10px] mt-2 font-bold px-3.5 flex items-center gap-1.5",
                  selectedSessionId === session.id
                    ? "text-primary-foreground/90"
                    : "text-primary",
                )}
              >
                <span className="opacity-50 tracking-widest uppercase">
                  Messages:
                </span>
                {session.messages.length}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Toggle & Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-full p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between text-primary font-bold active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <Bot size={20} />
              <span className="text-sm">View All Sessions</span>
            </div>
            <Info size={18} className="opacity-50" />
          </button>
        </div>

        <div className="flex-1 border border-border/50 rounded-3xl flex flex-col overflow-hidden bg-card shadow-sm">
          <div className="p-4 sm:p-6 border-b border-border/50 bg-muted/5 backdrop-blur-md flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Bot size={22} />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base tracking-tight leading-none">
                  {selectedSession?.ipAddress}
                </h3>
                <p
                  className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-1"
                  suppressHydrationWarning
                >
                  {selectedSession &&
                    mounted &&
                    format(new Date(selectedSession.updatedAt), "PPp")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 custom-scrollbar">
            {selectedSession?.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 sm:gap-4 max-w-[90%] sm:max-w-[80%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "",
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground shadow-primary/20"
                      : "bg-muted text-muted-foreground border border-border/50",
                  )}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                <div className="space-y-2">
                  <div
                    className={cn(
                      "rounded-3xl p-4 sm:p-6 text-sm relative group transition-all",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none shadow-lg shadow-primary/5"
                        : "bg-muted/50 border border-border/50 rounded-tl-none",
                    )}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-2",
                      msg.role === "user"
                        ? "justify-end text-primary-foreground/70"
                        : "justify-between text-muted-foreground",
                    )}
                  >
                    {msg.role === "ai" && msg.metadata && (
                      <button
                        onClick={() => setSelectedMessage(msg)}
                        className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 hover:text-primary transition-all group"
                      >
                        <Info className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                        Details
                      </button>
                    )}
                    <div className="text-[10px] font-bold opacity-50 tracking-tighter">
                      {format(new Date(msg.createdAt), "HH:mm")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </div>
      </div>

      {/* Message Details Overlay */}
      <AnimatePresence>
        {selectedMessage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMessage(null)}
              className="fixed inset-0 bg-background/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[500px] lg:w-[600px] border-l border-border/50 flex flex-col overflow-hidden bg-background/95 backdrop-blur-2xl z-50 shadow-2xl"
            >
              <div className="p-6 border-b border-border/50 font-bold flex justify-between items-center bg-muted/20">
                <div className="flex items-center gap-3 text-primary">
                  <Info size={20} />
                  <span className="tracking-tight">Message Details</span>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-2.5 bg-secondary/50 hover:bg-secondary rounded-xl transition-all active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
                    Metadata
                  </h3>
                  <div className="rounded-3xl overflow-hidden border border-border/50 shadow-sm">
                    <CodeBlock
                      code={JSON.stringify(selectedMessage.metadata, null, 2)}
                      language="json"
                      wrap={true}
                    />
                  </div>
                </div>

                <div className="p-6 bg-primary/5 rounded-3xl border border-primary/20 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-primary uppercase tracking-widest">
                      Recorded At
                    </span>
                    <span className="font-medium text-muted-foreground italic">
                      {format(new Date(selectedMessage.createdAt), "HH:mm:ss")}
                    </span>
                  </div>
                  <div className="h-px bg-primary/10" />
                  <div className="text-xs text-muted-foreground leading-relaxed font-medium">
                    This metadata provides internal context for the AI response,
                    including tool calls, tokens used, and model parameters.
                  </div>
                  <div
                    className="text-[10px] font-bold text-muted-foreground uppercase opacity-40"
                    suppressHydrationWarning
                  >
                    Full Timestamp:{" "}
                    {mounted &&
                      format(new Date(selectedMessage.createdAt), "PPpp")}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
