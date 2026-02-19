"use client";

import SectionHeading from "@/components/common/SectionHeading";
import { useTranslations } from "next-intl";

interface AboutData {
  aboutTitle?: string;
  aboutDescription?: string;
}

export default function About({
  data,
  stats,
}: {
  data?: AboutData | null;
  stats?: {
    projectCount: number;
    experienceYears: number;
    visitorCount: number;
  };
}) {
  const t = useTranslations("About");

  const experienceYears = stats?.experienceYears || 0;
  const rawProjectCount = stats?.projectCount || 0;
  const rawVisitorCount = stats?.visitorCount || 0;

  const projectCount =
    rawProjectCount >= 100
      ? Math.floor(rawProjectCount / 100) * 100
      : Math.floor(rawProjectCount / 10) * 10;

  const visitorCount =
    rawVisitorCount >= 1000
      ? Math.floor(rawVisitorCount / 100) * 100
      : rawVisitorCount >= 100
        ? Math.floor(rawVisitorCount / 50) * 50
        : Math.floor(rawVisitorCount / 10) * 10;

  const title = data?.aboutTitle || t("title");
  const description = data?.aboutDescription || t("description");

  return (
    <section className="py-12" id="about">
      <SectionHeading subHeading={t("subTitle")} heading={title} />

      <div className="pixel-card max-w-3xl">
        <div className="space-y-4">
          {description
            .split("\n")
            .filter((p: string) => p.trim() !== "")
            .map((paragraph: string, index: number) => (
              <p key={index} className="text-muted-foreground leading-relaxed">
                {paragraph.trim()}
              </p>
            ))}
        </div>

        <div className="flex flex-wrap gap-8 mt-6">
          <div className="text-center min-w-[100px]">
            <div className="text-3xl font-bold text-primary">
              {t("experienceCount", { count: experienceYears })}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("experienceLabel")}
            </div>
          </div>
          <div className="text-center min-w-[100px]">
            <div className="text-3xl font-bold text-primary">
              {t("projectCount", { count: projectCount })}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("projectLabel")}
            </div>
          </div>
          <div className="text-center min-w-[100px]">
            <div className="text-3xl font-bold text-primary">
              {t("visitorCount", { count: visitorCount })}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("visitorLabel")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
