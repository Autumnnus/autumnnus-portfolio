"use client";

import SectionHeading from "@/components/common/SectionHeading";
import { PROJECTS_DATA } from "@/config/contents";
import { useTranslations } from "next-intl";

export default function About() {
  const t = useTranslations("About");
  const experienceYears = new Date().getFullYear() - 2022;
  const rawProjectCount = PROJECTS_DATA.length;
  const projectCount =
    rawProjectCount >= 100
      ? Math.floor(rawProjectCount / 100) * 100
      : Math.floor(rawProjectCount / 10) * 10;

  return (
    <section className="py-12" id="about">
      <SectionHeading subHeading={t("subTitle")} heading={t("title")} />

      <div className="pixel-card max-w-3xl">
        <div className="space-y-4">
          {t("description")
            .split("\n")
            .filter((p) => p.trim() !== "")
            .map((paragraph, index) => (
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
