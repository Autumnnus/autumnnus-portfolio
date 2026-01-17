"use client";

import { WorkExperience } from "@/types/contents";
import Image from "next/image";

interface WorkCardProps {
  experience: WorkExperience;
}

export default function WorkCard({ experience }: WorkCardProps) {
  const { company, role, period, description, logo } = experience;

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
          </div>

          <span className="text-sm font-pixel text-muted-foreground whitespace-nowrap">
            {period}
          </span>
        </div>

        {/* Position / Role */}
        <div className="text-base font-medium text-foreground/90">{role}</div>

        {/* Description */}
        <div className="text-sm text-muted-foreground leading-relaxed">
          <p className="before:content-['•'] before:mr-2 before:text-primary">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}
