"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChatLoading, ChatMessage, Message } from "./ChatMessage";

export default function LiveChat() {
  const t = useTranslations("Chat");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Extract locale from pathname (e.g. /tr/blog -> tr)
  const currentLocale = pathname.split("/")[1] || "en";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      setMessages([
        {
          id: "welcome",
          role: "ai",
          content: t("greeting"),
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, t, messages.length]);

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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(t("rateLimitMessage"));
        }
        throw new Error(data.error || t("errorMessage"));
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: data.response,
        timestamp: new Date(),
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
            className="fixed bottom-24 right-4 z-50 w-[350px] sm:w-[400px] h-[500px] bg-background border rounded-xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/50">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{t("title")}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    Powered by Gemini AI
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="flex flex-col gap-4">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                {isLoading && <ChatLoading />}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t bg-muted/20">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("placeholder")}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </motion.button>
    </>
  );
}
