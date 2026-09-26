"use client";

import { saveAssistantSettingsAction } from "@/app/[locale]/admin/assistant/actions";
import { GEMINI_MODELS, MODEL_PRICES_CHECKED_AT, findModel } from "@/lib/ai/models";
import { Loader2, Save } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface Values {
  enabled: boolean;
  modelFast: string;
  modelDeep: string;
  visitorDailyLimit: number;
  globalDailyLimit: number;
  retentionDays: number;
}

export default function AssistantSettingsForm({ initial }: { initial: Values }) {
  const t = useTranslations("Admin.Assistant.settings");
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();
  const locale = useLocale() === "tr" ? "tr" : "en";

  const price = (value: number) => `$${value.toFixed(2)}`;

  const modelField = (key: "modelFast" | "modelDeep") => {
    const selected = findModel(values[key]);
    return (
      <label className="block space-y-1.5 text-sm">
        <span className="block font-medium">{t(key)}</span>
        <span className="block text-xs text-muted-foreground">{t(`${key}Hint`)}</span>
        <select
          value={values[key]}
          onChange={(event) => setValues((v) => ({ ...v, [key]: event.target.value }))}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          {!selected && <option value={values[key]}>{values[key]}</option>}
          {GEMINI_MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label} — {price(model.input)} / {price(model.output)}
              {model.freeTier ? ` · ${t("freeTier")}` : ""}
            </option>
          ))}
        </select>
        {selected && (
          <span className="block font-mono text-[0.7rem] text-muted-foreground">
            {t("priceLine", { input: price(selected.input), output: price(selected.output) })}
            {selected.note ? ` · ${selected.note[locale]}` : ""}
          </span>
        )}
      </label>
    );
  };

  const numberField = (
    key: "visitorDailyLimit" | "globalDailyLimit" | "retentionDays",
    max: number,
  ) => (
    <label className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{t(key)}</span>
      <input
        type="number"
        min={1}
        max={max}
        value={values[key]}
        onChange={(event) =>
          setValues((v) => ({ ...v, [key]: Math.max(1, Number(event.target.value) || 1) }))
        }
        className="w-28 rounded-lg border border-border bg-background px-3 py-1.5 text-right font-mono text-sm focus:border-primary focus:outline-none"
      />
    </label>
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          try {
            await saveAssistantSettingsAction(values);
            toast.success(t("saved"));
          } catch (error) {
            toast.error((error as Error).message);
          }
        });
      }}
      className="space-y-4"
    >
      <label className="flex items-start justify-between gap-4">
        <span>
          <span className="block text-sm font-medium">{t("enabled")}</span>
          <span className="block text-xs text-muted-foreground">{t("enabledHint")}</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={values.enabled}
          onClick={() => setValues((v) => ({ ...v, enabled: !v.enabled }))}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${values.enabled ? "bg-primary" : "bg-muted-foreground/30"}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${values.enabled ? "translate-x-5" : "translate-x-0.5"}`}
          />
        </button>
      </label>
      {modelField("modelFast")}
      {modelField("modelDeep")}
      <p className="text-[0.7rem] text-muted-foreground">
        {t("pricesNote", { date: MODEL_PRICES_CHECKED_AT })}
      </p>
      {numberField("visitorDailyLimit", 1_000)}
      {numberField("globalDailyLimit", 100_000)}
      {numberField("retentionDays", 730)}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {t("save")}
      </button>
    </form>
  );
}
