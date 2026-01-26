"use client";

import SectionHeading from "@/components/common/SectionHeading";
import { PROJECTS_DATA } from "@/config/contents";
import { useTranslations } from "next-intl";

interface AboutData {
  aboutTitle?: string;
  aboutDescription?: string;
}

export default function About({ data }: { data?: AboutData | null }) {
  const t = useTranslations("About");
  const experienceYears = new Date().getFullYear() - 2022;
  const rawProjectCount = PROJECTS_DATA.length;
  const projectCount =
    rawProjectCount >= 100
      ? Math.floor(rawProjectCount / 100) * 100
      : Math.floor(rawProjectCount / 10) * 10;

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

        <div className="flex gap-8 mt-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {t("experienceCount", { count: experienceYears })}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("experienceLabel")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {t("projectCount", { count: projectCount })}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("projectLabel")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
