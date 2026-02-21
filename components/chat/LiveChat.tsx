"use client";

import { getProfile } from "@/app/actions";
import { type SourceItem } from "@/app/api/chat/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatLoading, ChatMessage, Message } from "./ChatMessage";

const STORAGE_KEY = "autumnnus_chat_history";
const MAX_MESSAGES = 50;

export default function LiveChat() {
  const t = useTranslations("Chat");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const [adminAvatar, setAdminAvatar] = useState<string>("");

  const pathname = usePathname();

  // Extract locale from pathname (e.g. /tr/blog -> tr)
  const pathnameParts = pathname.split("/");
  const currentLocale = (
    pathnameParts.length > 1 && pathnameParts[1] ? pathnameParts[1] : "en"
  ) as
    | "tr"
    | "en"
    | "de"
    | "fr"
    | "es"
    | "it"
    | "pt"
    | "ru"
    | "ja"
    | "ko"
    | "ar"
    | "zh";

  // Fetch Admin Profile for Avatar
  useEffect(() => {
    async function fetchAdminData() {
      try {
        const profile = await getProfile(currentLocale);
        if (profile?.avatar) {
          setAdminAvatar(profile.avatar);
        }
      } catch (err) {
        console.error("Failed to fetch admin avatar:", err);
      }
    }
    fetchAdminData();
  }, [currentLocale]);
  const [guestEmail, setGuestEmail] = useState<string | null>(null);

  useEffect(() => {
    // Only access localStorage in the browser
    const storedEmail = localStorage.getItem("commentAuthorEmail");
    if (storedEmail) {
      setGuestEmail(storedEmail);
    }
  }, []);

  const adminEmail =
    process.env.NEXT_PUBLIC_ADMIN_EMAIL || "prostochasy@gmail.com";
  const isAdmin = session?.user?.email === adminEmail;

  // Use session email for admin. For regular users, session means nothing here since only admin logins
  // But we'll fallback to guestEmail from localStorage (if they left a comment before).
  const userEmail = isAdmin ? session?.user?.email : guestEmail;

  const userImage = isAdmin
    ? session?.user?.image ||
      `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(userEmail!)}`
    : userEmail
      ? `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(userEmail)}`
      : `https://api.dicebear.com/7.x/lorelei/svg?seed=guest`;

  const aiImage = adminAvatar;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Persistence: Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages.slice(-MAX_MESSAGES)),
      );
    }
  }, [messages]);

  // Persistence: Load messages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: Message[] = JSON.parse(saved);
        // Revive Date objects
        const revived = parsed.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(revived);
      } catch (err) {
        console.error("Failed to parse chat history:", err);
      }
    }
  }, []);

  // Initial greeting (only if no messages exist yet OR only welcome message exists and language changed)
  useEffect(() => {
    const isOnlyWelcome = messages.length === 1 && messages[0].id === "welcome";
    if ((messages.length === 0 || isOnlyWelcome) && isOpen) {
      const currentGreeting = t("greeting");

      // Update if empty OR if it's the welcome message but content differs (language change)
      if (messages.length === 0 || messages[0].content !== currentGreeting) {
        setMessages([
          {
            id: "welcome",
            role: "ai",
            content: currentGreeting,
            timestamp: new Date(),
          },
        ]);
      }
    }
  }, [isOpen, t, messages]);

  const handleNewChat = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([
      {
        id: "welcome",
        role: "ai",
        content: t("greeting"),
        timestamp: new Date(),
      },
    ]);
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          locale: currentLocale,
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(t("rateLimitMessage"));
        }
        throw new Error(data.error || t("errorMessage"));
      }

      // Filter out sources that have already been shown in previous messages
      const shownSourceUrls = new Set(
        messages.flatMap((m) => m.sources ?? []).map((s) => s.url),
      );

      const uniqueSources = (data.sources ?? []).filter(
        (s: SourceItem) => !shownSourceUrls.has(s.url),
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: data.response,
        timestamp: new Date(),
        sources: uniqueSources,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: (error as Error).message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 z-50 w-[380px] sm:w-[450px] h-[600px] max-h-[85vh] bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-primary/5 flex flex-col overflow-hidden ring-1 ring-black/5 dark:ring-white/5"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded-full shadow-inner">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm tracking-tight">
                    {t("title")}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    {t("poweredBy") || "Powered by Gemini AI"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-muted/50 rounded-full transition-colors"
                  onClick={handleNewChat}
                  title={t("newChat") || "New Chat"}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-muted/50 rounded-full transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 min-h-0 p-4 overflow-y-auto overflow-x-hidden custom-scrollbar overscroll-contain"
              onWheelCapture={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-4 min-h-min">
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    userImage={userImage}
                    aiImage={aiImage}
                  />
                ))}
                {isLoading && <ChatLoading aiImage={aiImage} />}
                <div ref={scrollRef} />
              </div>
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-md"
            >
              <div className="flex gap-2 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("placeholder")}
                  className="flex-1 pr-12 rounded-full border-muted-foreground/20 focus-visible:ring-primary/50 bg-muted/20"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-1 top-1 bottom-1 h-8 w-8 rounded-full shadow-sm transition-transform active:scale-95"
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all border border-primary/20"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
