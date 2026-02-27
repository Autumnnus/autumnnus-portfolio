import Container from "@/components/common/Container";
import { Link } from "@/i18n/routing";
import { Leaf, Snowflake } from "lucide-react";
import { useTranslations } from "next-intl";

export default function NotFoundPage() {
  const t = useTranslations("NotFound");

  return (
    <div className="relative overflow-hidden flex-1 flex flex-col justify-center items-center py-20 min-h-[70vh]">
      {/* Decorative Theme Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Winter aesthetic elements */}
        <div className="absolute top-[15%] left-[10%] text-blue-200/30 dark:text-blue-200/10 animate-pulse">
          <Snowflake size={64} />
        </div>
        <div className="absolute top-[60%] right-[15%] text-blue-300/20 dark:text-blue-300/10 animate-pulse delay-500">
          <Snowflake size={48} />
        </div>

        {/* Autumn aesthetic elements */}
        <div className="absolute top-[25%] right-[20%] text-orange-400/30 dark:text-orange-400/10 animate-pulse delay-300">
          <Leaf size={56} className="rotate-45" />
        </div>
        <div className="absolute bottom-[20%] left-[25%] text-amber-500/20 dark:text-amber-500/10 animate-pulse delay-700">
          <Leaf size={72} className="-rotate-12" />
        </div>
      </div>

      <Container className="relative z-10 flex flex-col items-center justify-center text-center">
        <div className="bg-background/40 backdrop-blur-sm p-8 md:p-12 rounded-2xl border border-white/10 dark:border-white/5 shadow-2xl">
          <h1 className="text-8xl md:text-9xl font-pixel bg-gradient-to-br from-primary via-orange-400 to-blue-400 bg-clip-text text-transparent mb-6 drop-shadow-sm select-none">
            {t("title")}
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 font-space-grotesk flex items-center justify-center gap-3">
            <Leaf className="text-orange-400 animate-bounce" size={24} />
            {t("subtitle")}
            <Snowflake
              className="text-blue-400 animate-bounce delay-150"
              size={24}
            />
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-10 text-lg font-space-mono">
            {t("description")}
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-pixel text-xs sm:text-sm rounded-lg shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all hover:-translate-y-1 active:translate-y-0"
          >
            {t("backToHome")}
          </Link>
        </div>
      </Container>
    </div>
  );
}
