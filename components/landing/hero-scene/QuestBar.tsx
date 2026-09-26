"use client";

import PixelIcon from "@/components/pixel/PixelIcon";
import { CHEATS, CheatId, CodeResult, matchCode } from "@/lib/pixel/cheats";
import { playSound } from "@/lib/pixel/sound";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { RefObject, useState } from "react";
import { HOTSPOTS } from "./engine";

type Feedback = { tone: "ok" | "close" | "miss"; text: string };

const PAD = ["↑", "↓", "←", "→", "B", "A"];
// Inside the console the arrow keys type arrows instead of moving the caret.
const ARROW_GLYPHS: Record<string, string> = {
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
};

/**
 * The quest strip under the hero scene. Step one asks for the scene's
 * secrets and shows the code console locked; once every secret is found the
 * console opens right here in the card (a real input, so phones get their
 * keyboard, plus a D-pad for the arrow code) and step two asks for the codes.
 */
export default function QuestBar({
  secrets,
  cheats,
  fresh,
  inputRef,
  onCode,
  onOpenHints,
}: {
  secrets: number;
  cheats: CheatId[];
  /** The console just unlocked and hasn't been tried yet. */
  fresh: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onCode: (input: string, result: CodeResult) => void;
  onOpenHints: () => void;
}) {
  const t = useTranslations("Hero.scene");
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [shake, setShake] = useState(0);
  const [misses, setMisses] = useState(0);

  const unlocked = secrets >= HOTSPOTS.length;
  const done = unlocked && cheats.length >= CHEATS.length;
  const step = done ? "done" : unlocked ? "codes" : "secrets";

  const submit = () => {
    if (!value.trim()) return;
    const result = matchCode(value);
    onCode(value, result);
    if (result.kind === "match") {
      const name = t(`code.${result.id}.title`);
      setFeedback({
        tone: "ok",
        text: cheats.includes(result.id)
          ? t("console.again", { name })
          : t("console.accepted", { name }),
      });
      setValue("");
      setMisses(0);
      return;
    }
    playSound("error");
    setShake((n) => n + 1);
    // A near miss stays editable; a miss is selected so typing replaces it.
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      if (result.kind === "miss") inputRef.current?.select();
    });
    setMisses((n) => n + 1);
    setFeedback({
      tone: result.kind,
      text:
        result.kind === "close"
          ? t("console.close")
          : misses + 1 >= 2
            ? t("console.missHint")
            : t("console.miss"),
    });
  };

  const press = (glyph: string) => {
    setValue((current) => (current + glyph).slice(0, 40));
    playSound("hover");
  };

  return (
    <div className="px-pop border-t-4 border-px-ink bg-slot/60 px-3 py-3 sm:px-5 sm:py-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span
          className={cn(
            "shrink-0 px-2 py-0.5 font-pixel text-xs font-bold tracking-wider uppercase",
            done ? "bg-gold text-px-ink" : "bg-primary text-primary-foreground",
          )}
        >
          {t(`quest.step.${step}`)}
        </span>
        <span className="min-w-0 flex-1 font-pixel text-sm leading-tight sm:text-base">
          {t(`quest.goal.${step}`)}
        </span>
        <span
          className="flex items-center gap-1"
          aria-label={
            unlocked
              ? t("codesLabel", { found: cheats.length, total: CHEATS.length })
              : t("secretsLabel", { found: secrets, total: HOTSPOTS.length })
          }
        >
          {(unlocked ? CHEATS : HOTSPOTS).map((id, index) => {
            const on = index < (unlocked ? cheats.length : secrets);
            return (
              <PixelIcon
                key={id}
                name={unlocked ? "sparkle" : "star"}
                className={cn(
                  "h-3.5 w-3.5 sm:h-4 sm:w-4",
                  on
                    ? cn(
                        "scene-star-on",
                        unlocked ? "text-primary" : "text-gold",
                      )
                    : "text-muted-foreground/40",
                )}
              />
            );
          })}
        </span>
      </div>

      {!unlocked ? (
        <div
          aria-hidden="true"
          className="mt-3 flex h-11 items-center gap-2 bg-slot px-3 text-muted-foreground opacity-70 pixel-frame-sm"
        >
          <PixelIcon name="lock" className="h-4 w-4 shrink-0" />
          <span className="truncate font-pixel text-sm">
            {t("quest.locked", { left: HOTSPOTS.length - secrets })}
          </span>
        </div>
      ) : (
        <>
          {/* On touch screens the pad sits above the input: when the keyboard
              opens, the input is scrolled to just above it and anything
              below would be hidden. */}
          <div className="flex flex-col">
            <form
              key={shake}
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
              className={cn(
                "mt-3 flex items-stretch gap-3 p-[3px] pointer-coarse:mt-2",
                shake > 0 && "console-shake",
              )}
            >
              <label
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 bg-card px-3 pixel-frame-sm",
                  fresh && "scene-chip-pulse",
                )}
              >
                <span
                  aria-hidden="true"
                  className="font-pixel text-lg text-ember"
                >
                  &gt;
                </span>
                <span className="sr-only">{t("console.inputLabel")}</span>
                <input
                  ref={inputRef}
                  value={value}
                  onChange={(event) =>
                    setValue(event.target.value.slice(0, 40))
                  }
                  onKeyDown={(event) => {
                    const glyph = ARROW_GLYPHS[event.key];
                    if (
                      !glyph ||
                      event.altKey ||
                      event.metaKey ||
                      event.ctrlKey
                    )
                      return;
                    event.preventDefault();
                    press(glyph);
                  }}
                  placeholder={t("console.placeholder")}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  enterKeyHint="go"
                  className="h-11 min-w-0 flex-1 bg-transparent font-pixel text-base tracking-wider outline-none placeholder:text-muted-foreground/60 sm:text-lg"
                />
              </label>
              <button
                type="submit"
                className="pixel-button pixel-button-primary pixel-button-sm"
              >
                {t("console.submit")}
              </button>
            </form>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pointer-coarse:order-first pointer-coarse:mt-3">
              <div
                className="flex items-center gap-1.5 p-[3px]"
                role="group"
                aria-label={t("console.pad")}
              >
                {PAD.map((glyph) => (
                  <button
                    key={glyph}
                    type="button"
                    // Keep focus where it is, so typing carries on in the input.
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => press(glyph)}
                    aria-label={t("console.padKey", { key: glyph })}
                    className="flex h-8 w-7 items-center justify-center bg-card font-pixel text-base font-bold transition-transform duration-100 pixel-frame-sm active:translate-y-0.5 sm:w-8 pointer-coarse:h-10 pointer-coarse:w-10"
                  >
                    {glyph}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onOpenHints}
                className={cn(
                  "pixel-button pixel-button-sm max-sm:w-full max-sm:justify-center",
                  misses >= 2 && "console-nudge",
                )}
              >
                <PixelIcon name="sparkles" className="h-3.5 w-3.5" />
                {t("quest.hints")}
              </button>
            </div>
          </div>
          <p
            aria-live="polite"
            className={cn(
              "mt-2 min-h-5 font-pixel text-sm",
              feedback?.tone === "ok" && "text-moss",
              feedback?.tone === "close" && "text-ember",
              (!feedback || feedback.tone === "miss") &&
                "text-muted-foreground",
            )}
          >
            {feedback?.text ?? t("quest.tip")}
          </p>
        </>
      )}
    </div>
  );
}
