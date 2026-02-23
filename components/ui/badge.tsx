import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline";
}

export default function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        {
          "bg-primary/10 text-primary hover:bg-primary/20":
            variant === "default",
          "bg-secondary text-secondary-foreground": variant === "secondary",
          "border border-border bg-background hover:bg-accent":
            variant === "outline",
        },
        className,
      )}
      {...props}
    />
  );
}
