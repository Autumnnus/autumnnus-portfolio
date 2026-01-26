"use client";

import Container from "@/components/common/Container";
import { Github } from "lucide-react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <Container className="min-h-[70vh] flex items-center justify-center">
      <div className="max-w-md w-full p-8 bg-card border border-border rounded-xl shadow-2xl text-center space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Admin Login</h1>
        <p className="text-muted-foreground">
          Sadece site sahibi giriş yapabilir.
        </p>
        <button
          onClick={() => signIn("github", { callbackUrl: "/admin" })}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-foreground text-background rounded-lg font-bold hover:opacity-90 transition-all group"
        >
          <Github className="w-6 h-6" />
          GitHub ile Giriş Yap
        </button>
      </div>
    </Container>
  );
}
