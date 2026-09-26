"use client";

import PixelIcon from "@/components/pixel/PixelIcon";
import { CHEATS, CheatId } from "@/lib/pixel/cheats";
import { playSound } from "@/lib/pixel/sound";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { useRef } from "react";

/**
 * Riddles for the secret codes, opened one letter at a time. Codes are not
 * typed here: the only way out is back to the console in the hero card, so
 * the visitor learns where codes go.
 */
export default function HintsDialog({
  open,
  onOpenChange,
  found,
  revealed,
  onReveal,
  onGoToConsole,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  found: CheatId[];
  revealed: Partial<Record<CheatId, number>>;
  onReveal: (id: CheatId) => void;
  /** Focus the card's console once the dialog has closed. */
  onGoToConsole: () => void;
}) {
  const t = useTranslations("Hero.scene");
  const toConsole = useRef(false);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="console-overlay fixed inset-0 z-[80] bg-px-ink/55" />
        <Dialog.Content
          data-lenis-prevent
          onCloseAutoFocus={(event) => {
            if (!toConsole.current) return;
            toConsole.current = false;
            event.preventDefault();
            onGoToConsole();
          }}
          className="console-panel pixel-panel fixed left-1/2 top-1/2 z-[81] flex max-h-[calc(100dvh-2rem)] w-[min(31rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col outline-none"
        >
          <div className="flex shrink-0 items-center gap-3 border-b-4 border-px-ink bg-primary px-4 py-3 text-primary-foreground">
            <PixelIcon name="sparkles" className="h-5 w-5" />
            <Dialog.Title className="flex-1 font-pixel text-lg font-bold tracking-wider uppercase">
              {t("console.title")}
            </Dialog.Title>
            <Dialog.Close
              aria-label={t("console.closeLabel")}
              className="flex h-8 w-8 items-center justify-center hover:bg-px-ink/15"
            >
              <PixelIcon name="close" className="h-3 w-3" />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 [-webkit-overflow-scrolling:touch]">
            <Dialog.Description className="mb-4 text-sm leading-relaxed text-muted-foreground">
              {t("console.subtitle")}
            </Dialog.Description>
            <ul className="flex flex-col gap-3 p-[3px]">
              {CHEATS.map((id) => {
                const done = found.includes(id);
                const answer = Array.from(t(`console.answers.${id}`));
                const shown = done ? answer.length : Math.min(revealed[id] ?? 0, answer.length);
                return (
                  <li
                    key={id}
                    className={cn(
                      "flex items-start gap-3 bg-card p-3 pixel-frame-sm",
                      done && "bg-slot-active",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center pixel-slot",
                        done ? "text-gold" : "text-muted-foreground",
                      )}
                    >
                      <PixelIcon name={done ? "sparkle" : "lock"} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-pixel text-sm font-semibold">
                        {done ? t(`code.${id}.title`) : "???"}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {t(`console.riddles.${id}`)}
                      </span>
                      <span
                        className="mt-1.5 flex flex-wrap gap-1 font-pixel text-base tracking-widest"
                        aria-label={done ? answer.join("") : t("console.hidden")}
                      >
                        {answer.map((char, index) => (
                          <span
                            key={index}
                            aria-hidden="true"
                            className={cn(
                              "inline-flex h-7 min-w-6 items-center justify-center border-b-2 border-px-ink px-0.5",
                              index < shown && "console-letter text-ember",
                            )}
                          >
                            {index < shown ? char.toLocaleUpperCase("tr") : ""}
                          </span>
                        ))}
                      </span>
                    </span>
                    {!done && shown < answer.length && (
                      <button
                        type="button"
                        onClick={() => {
                          onReveal(id);
                          playSound("item");
                        }}
                        aria-label={t("console.hintAria")}
                        className="shrink-0 bg-slot px-2 py-1 font-pixel text-xs pixel-frame-sm hover:bg-primary hover:text-primary-foreground"
                      >
                        {t("console.hint")}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="shrink-0 border-t-4 border-px-ink p-4">
            <Dialog.Close
              onClick={() => {
                toConsole.current = true;
              }}
              className="pixel-button pixel-button-primary w-full justify-center"
            >
              {t("console.goToConsole")}
              <PixelIcon name="arrow" className="h-3.5 w-2.5" />
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
