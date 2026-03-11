"use client";

import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { setGeminiApiKeyAction } from "@/app/[locale]/admin/actions";

interface GeminiApiKeyFormProps {
  initialHasCustomKey: boolean;
  envKeyAvailable: boolean;
}

export default function GeminiApiKeyForm({
  initialHasCustomKey,
  envKeyAvailable,
}: GeminiApiKeyFormProps) {
  const [inputValue, setInputValue] = useState("");
  const [isCustomKeyActive, setIsCustomKeyActive] =
    useState(initialHasCustomKey);
  const [isPending, startTransition] = useTransition();

  const currentStatus = isCustomKeyActive
    ? "Custom Gemini API key is currently cached."
    : envKeyAvailable
      ? "Using the environment Gemini API key."
      : "No Gemini API key configured yet.";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedValue = inputValue.trim();
    startTransition(async () => {
      try {
        await setGeminiApiKeyAction(trimmedValue || null);
        setIsCustomKeyActive(Boolean(trimmedValue));
        setInputValue("");
        toast.success(
          trimmedValue
            ? "Gemini API key cached and will be used immediately."
            : "Cached key cleared; environment value will be used if available.",
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not update the Gemini API key.",
        );
      }
    });
  };

  const handleClear = () => {
    if (!isCustomKeyActive) {
      toast.info("There is no cached Gemini key to clear.");
      return;
    }

    startTransition(async () => {
      try {
        await setGeminiApiKeyAction(null);
        setIsCustomKeyActive(false);
        setInputValue("");
        toast.success("Cached Gemini key removed.");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not clear the Gemini API key.",
        );
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Gemini API Key
        </label>
        <input
          name="geminiKey"
          type="password"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="Paste your Gemini API key here"
          className="w-full rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm font-medium text-foreground outline-none transition focus:ring-2 focus:ring-primary/50"
        />
        <p className="text-xs text-muted-foreground/80">{currentStatus}</p>
        <p className="text-xs text-muted-foreground/60">
          Save a custom key to override the environment setting. Leaving the
          field blank and saving will remove the cached override.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 min-w-[200px] rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:shadow-lg hover:shadow-primary/30 disabled:opacity-60 disabled:shadow-none"
        >
          {isCustomKeyActive ? "Update cached key" : "Cache key"}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!isCustomKeyActive || isPending}
          className="flex-1 min-w-[200px] rounded-2xl border border-border/70 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-foreground/50 disabled:opacity-40 disabled:border-border/40"
        >
          Clear cached key
        </button>
      </div>
    </form>
  );
}
