"use client";

import SectionHeading from "@/components/common/SectionHeading";
import PixelIcon, { PixelIconName } from "@/components/pixel/PixelIcon";
import Reveal, { useCountUp, useSeen } from "@/components/pixel/Reveal";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface AboutData {
  aboutTitle?: string;
  aboutDescription?: string;
  quests?: { id: string; completed: boolean; order: number; label: string }[];
}

interface Stats {
  projectCount: number;
  experienceYears: number;
  visitorCount: number;
  blogCount: number;
}

function StatTile({
  value,
  label,
  hint,
  icon,
  start,
  delay,
  onClick,
}: {
  value: number;
  label: string;
  hint: string;
  icon: PixelIconName;
  start: boolean;
  delay: number;
  onClick?: () => void;
}) {
  const shown = useCountUp(value, start);
  const body = (
    <>
      <PixelIcon name={icon} className="h-4 w-4 text-ember" />
      <span className="font-pixel text-3xl leading-none font-bold">
        {shown}
      </span>
      <span className="font-pixel text-xs tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
    </>
  );
  const className =
    "flex h-full w-full flex-col items-start gap-1.5 px-4 py-3.5 text-left pixel-slot";

  return (
    <Reveal delay={delay} className="p-[3px]">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          title={hint}
          className={cn(
            className,
            "bg-slot-active transition-transform duration-100 hover:-translate-y-0.5",
          )}
        >
          {body}
        </button>
      ) : (
        <div title={hint} className={className}>
          {body}
        </div>
      )}
    </Reveal>
  );
}

export default function About({
  data,
  stats,
}: {
  data?: AboutData | null;
  stats?: Stats;
}) {
  const t = useTranslations("About");
  const [statsRef, statsSeen] = useSeen<HTMLDivElement>();

  const title = data?.aboutTitle || t("title");
  const description = data?.aboutDescription || t("description");
  const paragraphs = description
    .split("\n")
    .map((p: string) => p.trim())
    .filter(Boolean);
  const quests = [...(data?.quests ?? [])].sort((a, b) => a.order - b.order);
  const done = quests.filter((quest) => quest.completed).length;

  const handleVisitorClick = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("trigger-visitor-badge"));
    }, 700);
  };

  return (
    <section className="relative py-16" id="about">
      <SectionHeading subHeading={t("subTitle")} heading={title} icon="heart" />

      <div className="grid gap-10 p-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <div className="flex flex-col gap-8">
          {/* RPG dialogue box */}
          <Reveal className="relative pt-4">
            <div className="relative pixel-panel px-6 pb-10 pt-10 sm:px-9">
              <span className="absolute -top-5 left-6 bg-primary px-3.5 py-1.5 font-pixel text-base font-bold tracking-wider text-primary-foreground pixel-frame">
                KADIR
              </span>
              <h3 className="mb-5 font-pixel text-xl font-bold text-ember sm:text-2xl">
                {t("journeyTitle")}
              </h3>
              <div className="flex flex-col gap-4 text-base leading-relaxed text-foreground/85 sm:text-[1.05rem]">
                {paragraphs.map((paragraph: string, index: number) => (
                  <Reveal key={index} delay={120 + index * 110}>
                    <p className="text-pretty">{paragraph}</p>
                  </Reveal>
                ))}
              </div>
              <PixelIcon
                name="caretDown"
                className="px-blink absolute bottom-4 right-6 h-2 w-3.5 text-primary"
              />
            </div>
          </Reveal>

          {/* Stats */}
          <div ref={statsRef} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile
              value={stats?.experienceYears ?? 0}
              label={t("statYears")}
              hint={t("statYearsTooltip")}
              icon="star"
              start={statsSeen}
              delay={0}
            />
            <StatTile
              value={stats?.projectCount ?? 0}
              label={t("statProjs")}
              hint={t("statProjsTooltip")}
              icon="gem"
              start={statsSeen}
              delay={80}
            />
            <StatTile
              value={stats?.blogCount ?? 0}
              label={t("statBlogs")}
              hint={t("statBlogsTooltip")}
              icon="sparkles"
              start={statsSeen}
              delay={160}
            />
            <StatTile
              value={stats?.visitorCount ?? 0}
              label={t("statWins")}
              hint={t("statWinsTooltip")}
              icon="trophy"
              start={statsSeen}
              delay={240}
              onClick={handleVisitorClick}
            />
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Quest log */}
          <Reveal delay={150}>
            <div className="flex flex-col gap-4 pixel-panel p-5">
              <div className="flex items-center gap-2.5">
                <PixelIcon name="trophy" className="h-4 w-5 text-gold" />
                <h3 className="font-pixel text-base font-bold tracking-wider uppercase">
                  {t("currentQuest")}
                </h3>
              </div>
              <ul className="flex flex-col gap-3.5">
                {quests.length ? (
                  quests.map((quest, index) => (
                    <Reveal key={quest.id ?? index} delay={250 + index * 90}>
                      <li className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center pixel-frame-sm",
                            quest.completed ? "bg-moss" : "bg-slot",
                          )}
                        >
                          {quest.completed && (
                            <PixelIcon
                              name="check"
                              className="h-2.5 w-3.5 text-moss-foreground"
                            />
                          )}
                        </span>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            quest.completed &&
                              "text-muted-foreground line-through",
                          )}
                        >
                          {quest.label}
                        </span>
                      </li>
                    </Reveal>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">—</li>
                )}
              </ul>
              {quests.length > 0 && (
                <div className="flex items-center gap-3">
                  <span
                    className="flex flex-1 gap-[2px] bg-px-ink p-[2px]"
                    aria-hidden="true"
                  >
                    {quests.map((quest, index) => (
                      <span
                        key={quest.id ?? index}
                        className={cn(
                          "h-2.5 flex-1",
                          index < done ? "bg-moss" : "bg-slot",
                        )}
                      />
                    ))}
                  </span>
                  <span className="font-pixel text-sm text-muted-foreground">
                    {done}/{quests.length}
                  </span>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
