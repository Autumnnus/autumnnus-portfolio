"use client";

import { getLiveChatConfigAction } from "@/app/[locale]/admin/livechat/livechat-actions";
import { getProfile } from "@/app/actions";
import { type SourceItem } from "@/app/api/chat/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/api-client";
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
  const playedMessageIdsRef = useRef<Set<string>>(new Set());
  const pingPlayedRef = useRef(false);
  const { data: session } = useSession();
  const [adminAvatar, setAdminAvatar] = useState<string>("");
  const [config, setConfig] = useState<any>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [teaserText, setTeaserText] = useState("");
  const [hasInteracted, setHasInteracted] = useState(false);

  const pathname = usePathname();

  // Compute logical path (without locale prefix) synchronously
  const segments = pathname.split("/").filter(Boolean);
  const supportedLocales = ["tr", "en"];
  const isLocaleFirst =
    segments.length > 0 && supportedLocales.includes(segments[0]);
  const logicalPath = isLocaleFirst
    ? "/" + segments.slice(1).join("/")
    : "/" + segments.join("/");

  const isPathExcluded =
    config?.excludedPaths?.length > 0 &&
    config.excludedPaths.some(
      (p: string) => logicalPath === p || logicalPath.startsWith(p + "/"),
    );

  const isPathAllowed =
    !config?.allowedPaths?.length ||
    config.allowedPaths.some(
      (p: string) => logicalPath === p || logicalPath.startsWith(p + "/"),
    );

  // Extract locale from pathname (e.g. /tr/blog -> tr)
  const pathnameParts = pathname.split("/");
  const currentLocale = (
    pathnameParts.length > 1 && pathnameParts[1] ? pathnameParts[1] : "en"
  ) as "tr" | "en";

  // Load configuration
  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await getLiveChatConfigAction().catch(() => null);
        if (data) {
          setConfig(data);

          // Normalize current pathname: remove locale prefix for logic-based matching
          // e.g. /tr/blog -> /blog, /tr -> /
          const segs = pathname.split("/").filter(Boolean);
          const isLocFirst =
            segs.length > 0 && supportedLocales.includes(segs[0]);
          const lPath = isLocFirst
            ? "/" + segs.slice(1).join("/")
            : "/" + segs.join("/");

          // Find greeting for this path
          const currentPathGreeting =
            data.greetings.find(
              (g: { pathname: string }) => g.pathname === lPath,
            ) ||
            data.greetings.find(
              (g: { pathname: string }) => g.pathname === "/*",
            );

          if (currentPathGreeting) {
            const trans = currentPathGreeting.translations.find(
              (t: { language: string }) => t.language === currentLocale,
            );
            if (trans) setTeaserText(trans.text);
          }
        }
      } catch (err) {
        console.error("Failed to load chat config:", err);
      } finally {
        setConfigLoaded(true);
      }
    }
    loadConfig();
  }, [pathname, currentLocale]);

  // Sound Utility
  const playSound = useCallback(
    (type: "notification" | "ping") => {
      const customUrl =
        type === "ping" ? config?.pingSoundUrl : config?.notificationSoundUrl;
      const soundUrl = customUrl || `/assets/sounds/${type}.mp3`;
      const audio = new Audio(soundUrl);
      audio.play().catch((err) => {
        console.error("err", err);
      });
    },
    [config],
  );

  // Teaser Logic - only run if path is not excluded/blocked
  useEffect(() => {
    if (isPathExcluded || !isPathAllowed) return;
    if (!isOpen && !hasInteracted && teaserText && messages.length === 1) {
      const timer = setTimeout(() => {
        setShowTeaser(true);
        if (!pingPlayedRef.current) {
          playSound("ping");
          pingPlayedRef.current = true;
        }
        const hideTimer = setTimeout(() => setShowTeaser(false), 10000);
        return () => clearTimeout(hideTimer);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [
    isPathExcluded,
    isPathAllowed,
    isOpen,
    hasInteracted,
    teaserText,
    messages.length,
    playSound,
  ]);

  // Supplemental Ping Logic (if user opens chat before teaser)
  useEffect(() => {
    if (isPathExcluded || !isPathAllowed) return;
    if (isOpen && messages.length === 1 && !pingPlayedRef.current) {
      playSound("ping");
      pingPlayedRef.current = true;
    }
  }, [isPathExcluded, isPathAllowed, isOpen, messages.length, playSound]);

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
    if (isOpen && scrollRef.current) {
      const timer = setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading, isOpen]);

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
        const revived = parsed.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        // Mark all loaded messages as already-played so we don't re-trigger sounds
        playedMessageIdsRef.current = new Set(revived.map((m) => m.id));
        setMessages(revived);
      } catch (err) {
        console.error("Failed to parse chat history:", err);
      }
    }
  }, []);

  // Initial greeting: set welcome message as soon as teaserText is available (even before opening)
  useEffect(() => {
    if (!teaserText) return;
    setMessages((prev) => {
      const hasNonWelcome = prev.some((m) => m.id !== "welcome");
      if (hasNonWelcome) return prev; // Don't overwrite real conversation

      const currentGreeting = teaserText || t("greeting");
      const alreadySet =
        prev.length === 1 &&
        prev[0].id === "welcome" &&
        prev[0].content === currentGreeting;
      if (alreadySet) return prev;

      const welcomeMsg: Message = {
        id: "welcome",
        role: "ai",
        content: currentGreeting,
        timestamp: new Date(),
      };
      playedMessageIdsRef.current.add("welcome");
      return [welcomeMsg];
    });
  }, [teaserText, t]);

  // Play sound for genuinely NEW AI messages only (not on reloads, nav, open/close)
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "ai") return;
    if (playedMessageIdsRef.current.has(lastMsg.id)) return;

    playedMessageIdsRef.current.add(lastMsg.id);

    if (lastMsg.id === "welcome") return; // Handled by teaserText effect

    if (!isOpen) {
      // If closed: Play ping and show teaser with the new message
      playSound("ping");
      setTeaserText(lastMsg.content);
      setShowTeaser(true);
      const hideTimer = setTimeout(() => setShowTeaser(false), 10000);
      return () => clearTimeout(hideTimer);
    } else {
      // If open: Standard notification sound
      playSound("notification");
    }
  }, [messages, playSound, isOpen]);

  const handleNewChat = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    const welcomeMsg: Message = {
      id: "welcome",
      role: "ai",
      content: teaserText || t("greeting"),
      timestamp: new Date(),
    };
    playedMessageIdsRef.current = new Set(["welcome"]);
    setMessages([welcomeMsg]);
  }, [t, teaserText]);

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
      const data = await apiFetch<any>("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: userMessage.content,
          locale: currentLocale,
          history: messages.slice(-10).map((m: Message) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      // Filter out sources that have already been shown in previous messages
      const shownSourceUrls = new Set(
        messages.flatMap((m: Message) => m.sources ?? []).map((s) => s.url),
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

  // Don't render anything until config is loaded to prevent flash
  if (!configLoaded) return null;

  if (config && !config.isEnabled) {
    if (!isAdmin) return null;
  }

  // Check paths using pre-computed flags (also used to gate notifications above)
  if (config) {
    if (isPathExcluded) return null;
    if (!isPathAllowed) return null;
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 flex flex-col overflow-hidden bg-background/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl ring-1 ring-black/5 dark:ring-white/5
                       bottom-24 inset-x-4 h-[500px] max-h-[calc(100vh-120px)]
                       sm:left-auto sm:right-8 sm:w-[380px] sm:h-[600px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded-full shadow-inner">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm tracking-tight truncate max-w-[120px] sm:max-w-none">
                    {t("title")}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    {t("online")}
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

      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex flex-col items-end gap-4 overflow-visible">
        <AnimatePresence>
          {showTeaser && !isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10, x: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10, x: 20 }}
              onClick={() => {
                setIsOpen(true);
                setShowTeaser(false);
                setHasInteracted(true);
              }}
              className="relative max-w-[240px] sm:max-w-[320px] bg-background border border-border/50 p-4 rounded-2xl shadow-xl cursor-pointer hover:bg-muted/50 transition-colors group"
            >
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-background border-r border-b border-border/50 rotate-45" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTeaser(false);
                  setHasInteracted(true);
                }}
                className="absolute -top-2 -left-2 bg-muted hover:bg-muted-foreground/20 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity border border-border/50"
              >
                <X className="w-3 h-3" />
              </button>
              <p className="text-sm font-medium leading-relaxed">
                {teaserText}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setShowTeaser(false);
              setHasInteracted(true);
            }
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all border border-primary/20"
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
      </div>
    </>
  );
}
