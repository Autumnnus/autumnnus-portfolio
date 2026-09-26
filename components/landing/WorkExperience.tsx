"use client";

import Icon from "@/components/common/Icon";
import SectionHeading from "@/components/common/SectionHeading";
import Reveal from "@/components/pixel/Reveal";
import { cn, formatDate } from "@/lib/utils";
import { WorkExperience as WorkExperienceType } from "@/types/contents";
import { useLocale, useTranslations } from "next-intl";

export default function WorkExperience({
  data,
}: {
  data?: WorkExperienceType[];
}) {
  const t = useTranslations("Work");
  const locale = useLocale();
  const workItems = data || [];

  const formatExperienceDate = (date: string | Date | null | undefined) =>
    formatDate(date, { month: "short", year: "numeric" }, locale);

  return (
    <section className="py-16" id="work">
      <SectionHeading subHeading={t("subTitle")} heading={t("title")} icon="mountain" />

      {/* A dashed trail with a waypoint per role, current role first. */}
      <ol className="relative flex flex-col gap-8 pl-14 sm:pl-16">
        <span
          aria-hidden="true"
          className="absolute bottom-6 left-[22px] top-6 w-1 bg-[repeating-linear-gradient(180deg,var(--px-ink)_0_8px,transparent_8px_16px)] sm:left-[26px]"
        />
        {workItems.map((item, index) => {
          const current = !item.endDate;
          const period = `${formatExperienceDate(item.startDate)} — ${
            current ? t("present") : formatExperienceDate(item.endDate)
          }`;

          return (
            <li key={index} className="relative">
              <Reveal delay={index * 110}>
                <span
                  className={cn(
                    "absolute -left-14 top-1 flex h-11 w-11 items-center justify-center pixel-slot sm:-left-16 sm:h-[52px] sm:w-[52px]",
                    current && "work-current bg-slot-active",
                  )}
                >
                  <Icon src={item.logo} alt={item.company} size={24} />
                </span>

                <div className="flex flex-col gap-3 pixel-panel p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="font-pixel text-xl leading-tight font-bold sm:text-2xl">
                      {item.role}
                    </h3>
                    <span
                      className={cn(
                        "px-2.5 py-1 font-pixel text-sm pixel-chip",
                        current && "bg-primary text-primary-foreground",
                      )}
                    >
                      {period}
                    </span>
                  </div>
                  <p className="text-base text-muted-foreground">
                    <span className="font-semibold text-foreground">{item.company}</span>
                    <span aria-hidden="true"> · </span>
                    {item.locationType}
                  </p>
                  <p className="leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
