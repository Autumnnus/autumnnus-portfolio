"use client";

import Icon from "@/components/common/Icon";
import SectionHeading from "@/components/common/SectionHeading";
import { WorkExperience as WorkExperienceType } from "@/types/contents";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function WorkExperience({
  data,
}: {
  data?: WorkExperienceType[];
}) {
  const t = useTranslations("Work");
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const workItems = data || [];

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

  if (!mounted) return null;

  return (
    <section className="py-12" id="work">
      <SectionHeading subHeading={t("subTitle")} heading={t("title")} />

      <div className="relative max-w-3xl mx-auto">
        {/* Vertical Line */}
        <div className="absolute left-[20px] top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-12">
          {workItems.map((item, index) => {
            const startStr = formatDate(item.startDate);
            const endStr = item.endDate
              ? formatDate(item.endDate)
              : t("present");
            const period = `${startStr} - ${endStr}`;

            return (
              <motion.div
                key={index}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative pl-12"
              >
                {/* Timeline Dot with Icon */}
                <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-card border-2 border-primary flex items-center justify-center z-10">
                  <Icon
                    src={item.logo}
                    alt={item.company}
                    size={20}
                    className="text-primary"
                  />
                </div>

                <div className="bg-card border border-border p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-2">
                    <h3 className="text-xl font-bold text-foreground">
                      {item.role}
                    </h3>
                    <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mt-2 sm:mt-0 w-fit">
                      {period}
                    </span>
                  </div>

                  {/* ... rest of content */}

                  <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <h4 className="text-lg font-semibold">{item.company}</h4>
                    <span className="text-sm">•</span>
                    <span className="text-sm font-medium italic">
                      {item.locationType}
                    </span>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
