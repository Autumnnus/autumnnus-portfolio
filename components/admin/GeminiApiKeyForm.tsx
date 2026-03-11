"use client";

import { type FormEvent, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createGeminiApiKeyAction,
  deleteGeminiApiKeyAction,
  updateGeminiApiKeyAction,
} from "@/app/[locale]/admin/actions";
import type {
  AiApiKeyAdminRecord,
  ApiKeyCategory,
} from "@/lib/ai/api-key-pool";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface GeminiApiKeyFormProps {
  initialKeys: AiApiKeyAdminRecord[];
}

interface FormState {
  id: string | null;
  label: string;
  apiKey: string;
  category: ApiKeyCategory;
  priority: string;
  quotaGroup: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  id: null,
  label: "",
  apiKey: "",
  category: "free",
  priority: "0",
  quotaGroup: "",
  isActive: true,
};

function formatDate(value: string | null) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function GeminiApiKeyForm({
  initialKeys,
}: GeminiApiKeyFormProps) {
  const [keys, setKeys] = useState(initialKeys);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const blocked = keys.filter((key) => key.runtimeStatus.blockedUntil).length;
    const free = keys.filter((key) => key.category === "free").length;
    const paid = keys.filter((key) => key.category === "paid").length;
    const inactive = keys.filter((key) => !key.isActive).length;
    const runtimeUnavailable = keys.some(
      (key) => !key.runtimeStatus.runtimeAvailable,
    );

    return { blocked, free, paid, inactive, runtimeUnavailable };
  }, [keys]);

  const resetForm = () => setForm(EMPTY_FORM);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      try {
        const nextPriority = Number.parseInt(form.priority, 10);
        if (!Number.isInteger(nextPriority) || nextPriority < 0) {
          throw new Error("Priority must be a non-negative integer.");
        }

        const payload = {
          id: form.id ?? undefined,
          label: form.label,
          apiKey: form.apiKey,
          category: form.category,
          priority: nextPriority,
          quotaGroup: form.quotaGroup,
          isActive: form.isActive,
        };

        const nextKeys = form.id
          ? await updateGeminiApiKeyAction(payload)
          : await createGeminiApiKeyAction(payload);

        setKeys(nextKeys);
        resetForm();
        toast.success(
          form.id
            ? "Gemini API key updated."
            : "Gemini API key added to the pool.",
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not update the Gemini API key pool.",
        );
      }
    });
  };

  const handleEdit = (key: AiApiKeyAdminRecord) => {
    setForm({
      id: key.id,
      label: key.label,
      apiKey: "",
      category: key.category,
      priority: String(key.priority),
      quotaGroup: key.quotaGroup,
      isActive: key.isActive,
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this Gemini API key?")) {
      return;
    }

    startTransition(async () => {
      try {
        const nextKeys = await deleteGeminiApiKeyAction(id);
        setKeys(nextKeys);
        if (form.id === id) {
          resetForm();
        }
        toast.success("Gemini API key removed.");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not delete the Gemini API key.",
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Free
          </p>
          <p className="mt-2 text-2xl font-semibold">{stats.free}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Paid
          </p>
          <p className="mt-2 text-2xl font-semibold">{stats.paid}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Blocked
          </p>
          <p className="mt-2 text-2xl font-semibold">{stats.blocked}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Inactive
          </p>
          <p className="mt-2 text-2xl font-semibold">{stats.inactive}</p>
        </div>
      </div>

      {stats.runtimeUnavailable ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Redis runtime status could not be loaded. Key records are still
          editable, but live block state is unavailable until `REDIS_URL`
          becomes reachable.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-border/60 bg-background/60 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              {form.id ? "Edit Gemini key" : "Add Gemini key"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Free keys are always preferred over paid keys. Lower priority wins
              within the same category.
            </p>
          </div>
          {form.id ? (
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={isPending}
            >
              Cancel edit
            </Button>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Label</span>
            <input
              value={form.label}
              onChange={(event) =>
                setForm((current) => ({ ...current, label: event.target.value }))
              }
              placeholder="Primary free key"
              className="w-full rounded-2xl border border-border/60 bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/50"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Quota Group</span>
            <input
              value={form.quotaGroup}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  quotaGroup: event.target.value,
                }))
              }
              placeholder="gemini-project-free-1"
              className="w-full rounded-2xl border border-border/60 bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/50"
            />
          </label>

          <label className="space-y-2 text-sm md:col-span-2">
            <span className="font-medium">API Key</span>
            <input
              type="password"
              value={form.apiKey}
              onChange={(event) =>
                setForm((current) => ({ ...current, apiKey: event.target.value }))
              }
              placeholder={
                form.id
                  ? "Leave blank to keep the stored key"
                  : "Paste a Gemini API key"
              }
              className="w-full rounded-2xl border border-border/60 bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/50"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Category</span>
            <select
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  category: event.target.value as ApiKeyCategory,
                }))
              }
              className="w-full rounded-2xl border border-border/60 bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/50"
            >
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Priority</span>
            <input
              type="number"
              min="0"
              value={form.priority}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  priority: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-border/60 bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/50"
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
              className="size-4 rounded border-border"
            />
            <span>
              Active keys participate in rotation. Inactive keys stay stored but
              are never selected.
            </span>
          </label>
        </div>

        <Button type="submit" disabled={isPending}>
          {form.id ? "Save changes" : "Add key"}
        </Button>
      </form>

      <div className="space-y-4">
        {keys.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/60 bg-background/40 p-6 text-sm text-muted-foreground">
            No Gemini API keys configured yet.
          </div>
        ) : null}

        {keys.map((key) => (
          <div
            key={key.id}
            className="rounded-3xl border border-border/60 bg-background/60 p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{key.label}</h3>
                  <Badge
                    className={
                      key.category === "free"
                        ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20"
                        : "bg-sky-500/15 text-sky-300 hover:bg-sky-500/20"
                    }
                  >
                    {key.category}
                  </Badge>
                  <Badge variant={key.isActive ? "default" : "outline"}>
                    {key.isActive ? "active" : "inactive"}
                  </Badge>
                  <Badge
                    variant={key.runtimeStatus.blockedUntil ? "secondary" : "outline"}
                    className={
                      key.runtimeStatus.blockedUntil
                        ? "bg-amber-500/20 text-amber-200"
                        : undefined
                    }
                  >
                    {key.runtimeStatus.blockedUntil ? "blocked" : "available"}
                  </Badge>
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <p>Masked Key: {key.maskedKey}</p>
                  <p>Fingerprint: {key.keyFingerprint}</p>
                  <p>Quota Group: {key.quotaGroup}</p>
                  <p>Priority: {key.priority}</p>
                  <p>
                    Last Selected: {formatDate(key.runtimeStatus.lastSelectedAt)}
                  </p>
                  <p>Last Success: {formatDate(key.runtimeStatus.lastSuccessAt)}</p>
                  <p>Last Error: {formatDate(key.runtimeStatus.lastErrorAt)}</p>
                  <p>
                    Blocked Until: {formatDate(key.runtimeStatus.blockedUntil)}
                  </p>
                </div>

                {key.runtimeStatus.blockedUntil ? (
                  <p className="text-sm text-amber-200">
                    Current block reason: {key.runtimeStatus.blockReason ?? "unknown"}
                    {key.runtimeStatus.retryAfterSeconds
                      ? `, retry in ~${key.runtimeStatus.retryAfterSeconds}s`
                      : ""}
                    .
                  </p>
                ) : null}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleEdit(key)}
                  disabled={isPending}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDelete(key.id)}
                  disabled={isPending}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
