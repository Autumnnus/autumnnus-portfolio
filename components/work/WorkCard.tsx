"use client";

import { WorkExperience } from "@/config/work";
import * as Avatar from "@radix-ui/react-avatar";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Globe } from "lucide-react";

interface WorkCardProps {
  experience: WorkExperience;
}

export default function WorkCard({ experience }: WorkCardProps) {
  const {
    company,
    position,
    period,
    description,
    technologies,
    emoji,
    current,
  } = experience;

  return (
    <article className="group relative flex flex-col sm:flex-row gap-4 sm:gap-6 p-1 transition-all">
      {/* Connector Line (Optional decoration could go here) */}

      {/* Left Column: Avatar */}
      <div className="shrink-0">
        <Avatar.Root className="inline-flex items-center justify-center overflow-hidden w-12 h-12 sm:w-14 sm:h-14 rounded bg-secondary/20 pixel-border-sm">
          <Avatar.Fallback
            className="w-full h-full flex items-center justify-center text-2xl"
            delayMs={0}
          >
            {emoji}
          </Avatar.Fallback>
        </Avatar.Root>
      </div>

      {/* Right Column: Content */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Header: Company, Icons, Status, Date */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h3 className="font-bold text-lg leading-none">{company}</h3>

            {/* Placeholder Icons for future links */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button className="hover:text-primary transition-colors">
                    <Globe className="w-3.5 h-3.5" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                    sideOffset={5}
                  >
                    Şirket Web Sitesi
                    <Tooltip.Arrow className="fill-popover" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>

            {current && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                </span>
                Working
              </span>
            )}
          </div>

          <span className="text-sm font-pixel text-muted-foreground whitespace-nowrap">
            {period}
          </span>
        </div>

        {/* Position / Role */}
        <div className="text-base font-medium text-foreground/90">
          {position}
        </div>

        {/* Technologies */}
        <div className="flex flex-wrap gap-1.5">
          {technologies.map((tech) => (
            <span
              key={tech}
              className="inline-flex items-center px-2 py-1 rounded bg-secondary/10 border border-border/40 text-xs font-pixel text-secondary-foreground/80 hover:bg-secondary/20 transition-colors cursor-default"
            >
              {/* Simple icon mapping or generic icon could go here */}
              {tech}
            </span>
          ))}
        </div>

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
