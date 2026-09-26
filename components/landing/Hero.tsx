"use client";

import Icon from "@/components/common/Icon";
import HeroScene, {
  INTRO_SEEN_KEY,
} from "@/components/landing/hero-scene/HeroScene";
import PixelIcon from "@/components/pixel/PixelIcon";
import { Link } from "@/i18n/routing";
import { Skill, SocialLink } from "@/lib/db/schema";
import { playSound } from "@/lib/pixel/sound";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { CSSProperties, useEffect, useState } from "react";

interface HeroData {
  greetingText?: string;
  name?: string;
  title?: string;
  description?: string;
}

// Intro timeline (ms). CSS runs the visuals so they start before hydration;
// these constants keep the JS-driven parts (typing, sounds) in step.
const STAMP_AT = 500;
const LAND_AT = 860;
const TYPE_AT = 1000;
const INVENTORY_AT = 1400;
const INTRO_DONE_AT = 3200;

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function introWillPlay() {
  return (
    !document.documentElement.dataset.introSeen &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** RPG-dialogue typing. The full text is always in the DOM for readers. */
function TypedText({ text, className }: { text: string; className?: string }) {
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    if (!introWillPlay()) {
      setShown(text.length);
      return;
    }
    let count = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      setShown(0);
      interval = setInterval(() => {
        count = Math.min(text.length, count + 2);
        setShown(count);
        if (count % 6 === 0) playSound("type");
        if (count >= text.length) clearInterval(interval);
      }, 24);
    }, TYPE_AT);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [text]);

  const done = shown ?? 0;
  const typing = shown !== null && shown < text.length;

  return (
    <p className={cn("px-type", className)} data-typing={shown === null ? undefined : ""}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, done)}
        {typing && (
          <span className="px-blink ml-0.5 inline-block h-[1em] w-[0.5em] translate-y-[0.15em] bg-primary" />
        )}
        <span className="invisible">{text.slice(done)}</span>
      </span>
    </p>
  );
}

function Inventory({ skills }: { skills: Skill[] }) {
  const t = useTranslations("Hero");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-pixel text-lg font-semibold tracking-wide uppercase">
          {t("inventory")}
        </h2>
        <span className="font-pixel text-[15px] text-muted-foreground">
          {t("inventoryCount", { count: skills.length })}
        </span>
      </div>
      <ul className="grid grid-cols-4 gap-3.5 p-[3px]">
        {skills.map((skill, index) => (
          <li
            key={skill.id}
            className="px-pop"
            style={delay(INVENTORY_AT + index * 70)}
          >
            <div
              className="pixel-slot relative flex h-20 flex-col items-center justify-center gap-1.5 transition-colors duration-100 hover:bg-slot-active hover:outline-solid hover:outline-[3px] hover:outline-offset-[3px] hover:outline-gold"
              onMouseEnter={() => playSound("hover")}
            >
              <Icon src={skill.icon} alt="" size={28} />
              <span className="max-w-full truncate px-1 text-[11px] text-muted-foreground">
                {skill.name}
              </span>
              <span
                aria-hidden="true"
                className="px-sparkle pointer-events-none absolute -right-1.5 -top-1.5 text-gold"
                style={delay(INVENTORY_AT + 90 + index * 70)}
              >
                <PixelIcon name="sparkle" className="h-3 w-3" />
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Hero({
  data,
  skills = [],
  socialLinks = [],
}: {
  data?: HeroData | null;
  skills?: Skill[];
  socialLinks?: SocialLink[];
}) {
  const t = useTranslations("Hero");
  const tNav = useTranslations("Navbar");

  const greeting = (data?.greetingText || t("greeting")).trim();
  const displayName = data?.name || "Kadir";
  const displayTitle = data?.title || "Full Stack Developer";
  const description = data?.description || t("description");

  useEffect(() => {
    if (!introWillPlay()) return;
    const stamp = setTimeout(() => playSound("stamp"), LAND_AT);
    const items = skills.map((_, index) =>
      setTimeout(() => playSound("item"), INVENTORY_AT + index * 70),
    );
    const done = setTimeout(() => {
      document.documentElement.dataset.introSeen = "1";
      try {
        sessionStorage.setItem(INTRO_SEEN_KEY, "1");
      } catch {
        // Private mode: the intro simply plays again next time.
      }
    }, INTRO_DONE_AT);
    return () => {
      clearTimeout(stamp);
      clearTimeout(done);
      items.forEach(clearTimeout);
    };
  }, [skills]);

  return (
    <section id="hero" className="px-intro pt-8 sm:pt-12">
      <div className="pixel-panel px-shake m-1" style={delay(LAND_AT)}>
        <HeroScene label={t("sceneLabel")} />

        <div className="grid gap-10 border-t-4 border-px-ink p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-12">
          <div className="flex flex-col items-start gap-4">
            <span
              className="px-rise font-pixel text-xl text-muted-foreground sm:text-2xl"
              style={delay(STAMP_AT - 100)}
            >
              {greeting}
            </span>
            <h1
              className="px-stamp -mt-2 font-pixel text-7xl leading-[0.9] font-bold [text-shadow:5px_5px_0_var(--gold)] sm:text-8xl lg:text-[6.5rem]"
              style={delay(STAMP_AT)}
            >
              {displayName}
            </h1>
            <span
              className="px-rise mt-2 bg-foreground px-3 py-1.5 font-pixel text-base tracking-wider text-background uppercase"
              style={delay(LAND_AT + 60)}
            >
              {displayTitle}
            </span>
            <TypedText
              text={description}
              className="mt-1 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
            />

            <div className="mt-3 flex flex-wrap gap-5 p-1">
              <a
                href="#projects"
                className="pixel-button pixel-button-primary px-pop"
                style={delay(TYPE_AT + 150)}
              >
                {t("buttons.projects")}
                <PixelIcon name="arrow" className="h-3.5 w-2.5" />
              </a>
              <Link
                href="/blog"
                className="pixel-button px-pop"
                style={delay(TYPE_AT + 250)}
              >
                {tNav("Blog")}
              </Link>
            </div>

            {socialLinks.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-4 p-1">
                {socialLinks.map((link, index) => (
                  <li
                    key={link.id}
                    className="px-pop"
                    style={delay(TYPE_AT + 350 + index * 60)}
                  >
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.name}
                      title={link.name}
                      className="pixel-button pixel-button-sm pixel-button-icon"
                    >
                      <Icon src={link.icon} alt="" size={22} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {skills.length > 0 && <Inventory skills={skills} />}
        </div>
      </div>
    </section>
  );
}
