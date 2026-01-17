import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  heading: string;
  subHeading?: string;
  className?: string;
}

export default function SectionHeading({
  heading,
  subHeading,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("mb-8", className)}>
      {subHeading && (
        <span className="font-pixel text-xs uppercase tracking-widest text-primary mb-2 block">
          {subHeading}
        </span>
      )}
      <h2 className="text-3xl font-bold pixel-underline inline-block pb-2">
        {heading}
      </h2>
    </div>
  );
}
