"use client";

import Icon from "@/components/common/Icon";
import SectionHeading from "@/components/common/SectionHeading";
import { useLanguage } from "@/components/providers/LanguageContext";
import { motion } from "framer-motion";

export default function WorkExperience() {
  const { content } = useLanguage();
  const { work } = content;

  return (
    <section className="py-12" id="work">
      <SectionHeading subHeading={work.title} heading={work.title} />

      <div className="relative max-w-3xl mx-auto">
        {/* Vertical Line */}
        <div className="absolute left-[20px] top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-12">
          {work.items.map((item, index) => (
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
                    {item.period}
                  </span>
                </div>

                <h4 className="text-lg font-semibold text-muted-foreground mb-4">
                  {item.company}
                </h4>

                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
