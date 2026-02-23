"use client";

import { WorkExperience } from "@/types/contents";
import Image from "next/image";

import { useLocale, useTranslations } from "next-intl";

interface WorkCardProps {
  experience: WorkExperience;
}

export default function WorkCard({ experience }: WorkCardProps) {
  const { company, role, startDate, endDate, description, logo, locationType } =
    experience;
  const locale = useLocale();
  const t = useTranslations("Work");

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString(
      locale === "tr" ? "tr-TR" : "en-US",
      {
        month: "short",
        year: "numeric",
      },
    );
  };

  const startStr = formatDate(startDate);
  const endStr = endDate ? formatDate(endDate) : t("present");
  const period = `${startStr} - ${endStr}`;

  return (
    <article className="group relative flex flex-col sm:flex-row gap-4 sm:gap-6 p-1 transition-all">
      {/* Left Column: Logo */}
      <div className="shrink-0">
        <div className="inline-flex items-center justify-center overflow-hidden w-12 h-12 sm:w-14 sm:h-14 rounded bg-secondary/20 pixel-border-sm relative">
          <Image
            src={logo}
            alt={company}
            fill
            className="object-contain p-2"
            unoptimized
          />
        </div>
      </div>

      {/* Right Column: Content */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Header: Company, Icons, Date */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h3 className="font-bold text-lg leading-none">{company}</h3>
            <span className="text-sm border-l-2 border-border/50 pl-2 sm:pl-3 text-muted-foreground font-medium">
              {locationType}
            </span>
          </div>

          <span className="text-sm font-pixel text-muted-foreground whitespace-nowrap">
            {period}
          </span>
        </div>

        {/* Position / Role */}
        <div className="text-base font-medium text-foreground/90">{role}</div>

        {/* Description */}
        <div className="text-sm text-muted-foreground leading-relaxed space-y-1">
          {description
            .split("\n")
            .filter((line) => line.trim() !== "")
            .map((line, index) => (
              <p key={index}>{line.trim()}</p>
            ))}
        </div>
      </div>
    </article>
  );
}
