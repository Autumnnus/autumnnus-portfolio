"use client";

import SectionHeading from "@/components/common/SectionHeading";
import { useLanguage } from "@/components/providers/LanguageContext";

export default function About() {
  const { content } = useLanguage();
  const { about } = content;

  return (
    <section className="py-12" id="about">
      <SectionHeading subHeading={about.title} heading={about.title} />

      <div className="pixel-card max-w-3xl">
        <p className="text-muted-foreground leading-relaxed mb-4 whitespace-pre-wrap">
          {about.description}
        </p>

        <div className="flex gap-8 mt-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {about.experienceCount}
            </div>
            <div className="text-sm text-muted-foreground">
              {about.experienceLabel}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {about.projectCount}
            </div>
            <div className="text-sm text-muted-foreground">
              {about.projectLabel}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
