import PixelIcon, { PixelIconName } from "@/components/pixel/PixelIcon";
import Reveal from "@/components/pixel/Reveal";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SectionHeadingProps {
  heading: string;
  subHeading?: string;
  className?: string;
  /** Pixel icon in the badge; defaults to the season's leaf/snowflake. */
  icon?: PixelIconName;
  /** Optional control on the right, e.g. a "view all" button. */
  action?: ReactNode;
}

export default function SectionHeading({
  heading,
  subHeading,
  className,
  icon,
  action,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn("mb-10 flex flex-wrap items-end justify-between gap-5 p-1", className)}
    >
      <div className="flex items-center gap-4">
        <span className="section-badge flex h-12 w-12 shrink-0 items-center justify-center text-primary pixel-slot">
          {icon ? (
            <PixelIcon name={icon} className="h-6 w-6" />
          ) : (
            <>
              <PixelIcon
                name="leaf"
                palette={{ v: "var(--ember)", s: "var(--px-ink)" }}
                className="h-6 w-6 dark:hidden"
              />
              <PixelIcon name="snowflake" className="hidden h-6 w-6 dark:block" />
            </>
          )}
        </span>
        <div className="flex flex-col gap-1.5">
          {subHeading && (
            <span className="font-pixel text-sm tracking-wider text-ember uppercase">
              {subHeading}
            </span>
          )}
          <h2 className="font-pixel text-3xl leading-none font-bold sm:text-4xl">
            {heading}
          </h2>
        </div>
      </div>
      {action}
    </Reveal>
  );
}
