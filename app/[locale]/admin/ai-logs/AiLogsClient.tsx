"use client";

import CodeBlock from "@/components/common/CodeBlock";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Bot, Info, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
  metadata: any;
};

type Session = {
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedSessionId, selectedSession?.messages]);

  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center border rounded-lg bg-card text-muted-foreground">
        No sessions found.
      </div>
    );
  }

  return (
    <div className="flex-1 flex gap-6 overflow-hidden min-h-0 relative">
      {/* Session List Column */}
      <div className="w-80 border rounded-lg flex flex-col overflow-hidden bg-card shrink-0">
        <div className="p-4 border-b font-medium text-sm text-muted-foreground">
          Sessions
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => {
                setSelectedSessionId(session.id);
                setSelectedMessage(null);
              }}
              className={cn(
                "w-full text-left p-4 border-b transition-colors hover:bg-accent hover:text-accent-foreground",
                selectedSessionId === session.id &&
                  "bg-accent text-accent-foreground",
              )}
            >
              <div className="font-medium text-sm truncate">
                {session.ipAddress}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {format(new Date(session.updatedAt), "PPp")}
              </div>
              <div className="text-xs mt-2 text-muted-foreground font-medium">
                {session.messages.length} messages
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Column */}
      <div className="flex-1 border rounded-lg flex flex-col overflow-hidden bg-card">
        <div className="p-4 border-b font-medium flex justify-between items-center shadow-sm z-10">
          <span>{selectedSession?.ipAddress}</span>
          <span className="text-xs text-muted-foreground">
            {selectedSession &&
              format(new Date(selectedSession.updatedAt), "PPp")}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {selectedSession?.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 max-w-[85%]",
                msg.role === "user" ? "ml-auto flex-row-reverse" : "",
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div
                className={cn(
                  "rounded-2xl p-4 text-sm relative group",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted rounded-tl-sm",
                )}
              >
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 mt-2",
                    msg.role === "user"
                      ? "justify-end text-primary-foreground/70"
                      : "justify-between text-muted-foreground",
                  )}
                >
                  {msg.role === "ai" && msg.metadata && (
                    <button
                      onClick={() => setSelectedMessage(msg)}
                      className="text-xs flex items-center gap-1 hover:text-foreground transition-colors"
                      title="View Details"
                    >
                      <Info className="w-3.5 h-3.5" />
                      Details
                    </button>
                  )}
                  <div className="text-[10px]">
                    {format(new Date(msg.createdAt), "HH:mm")}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Message Details Sidebar */}
      {selectedMessage && (
        <div className="w-196 border rounded-lg flex flex-col overflow-hidden bg-card absolute right-0 top-0 bottom-0 shadow-lg animate-in slide-in-from-right-8 z-20">
          <div className="p-4 border-b font-medium flex justify-between items-center bg-muted/50">
            <span>Message Details</span>
            <button
              onClick={() => setSelectedMessage(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 text-sm">
            <h3 className="font-semibold mb-2">Metadata</h3>
            <CodeBlock
              code={JSON.stringify(selectedMessage.metadata, null, 2)}
              language="json"
              wrap={true}
            />
            <div className="mt-4 text-xs text-muted-foreground">
              <strong>Time:</strong>{" "}
              {format(new Date(selectedMessage.createdAt), "PPpp")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
