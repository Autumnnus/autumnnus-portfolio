import { getAboutStats } from "@/app/actions";
import { Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function VisitorBadge() {
  const t = await getTranslations("Footer");
  const stats = await getAboutStats();

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-secondary/30 border-2 border-border rounded-lg group hover:border-primary/50 transition-colors cursor-default">
      <div className="p-1 bg-primary/10 rounded group-hover:bg-primary/20 transition-colors">
        <Users className="w-3.5 h-3.5 text-primary" />
      </div>
      <span className="text-[10px] font-pixel uppercase tracking-tighter text-muted-foreground group-hover:text-foreground transition-colors">
        {t("visitorStats", { count: stats.visitorCount })}
      </span>
    </div>
  );
}
