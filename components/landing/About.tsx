"use client";

import SectionHeading from "@/components/common/SectionHeading";
import { useTranslations } from "next-intl";

export default function About() {
  const t = useTranslations("About");

  return (
    <section className="py-12" id="about">
      <SectionHeading subHeading={t("title")} heading={t("title")} />

      <div className="pixel-card max-w-3xl">
        <p className="text-muted-foreground leading-relaxed mb-4 whitespace-pre-wrap">
          {t("description")}
        </p>

        <div className="flex gap-8 mt-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {t("experienceCount")}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("experienceLabel")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {t("projectCount")}
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
