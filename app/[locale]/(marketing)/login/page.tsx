"use client";

import Container from "@/components/common/Container";
import { Github } from "lucide-react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const t = useTranslations("Login");

  return (
    <Container className="min-h-[70vh] flex items-center justify-center">
      <div className="max-w-md w-full p-8 bg-card border border-border rounded-xl shadow-2xl text-center space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
        <button
          onClick={() => signIn("github", { callbackUrl: "/admin" })}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-foreground text-background rounded-lg font-bold hover:opacity-90 transition-all group"
        >
          <Github className="w-6 h-6" />
          {t("button")}
        </button>
      </div>
    </Container>
  );
}
