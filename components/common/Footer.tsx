import VisitorTracker from "@/components/interactive/VisitorTracker";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import Container from "./Container";
import VisitorBadge from "./VisitorBadge";
import VisitorBadgeLoading from "./VisitorBadgeLoading";

export default async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Footer" });

  return (
    <footer className="border-t-4 border-border bg-card mt-20">
      <VisitorTracker />
      <Container className="py-12 sm:py-16">
        <div className="flex flex-col items-center gap-8 sm:gap-10">
          <Suspense fallback={<VisitorBadgeLoading />}>
            <VisitorBadge locale={locale} />
          </Suspense>
          <p className="font-pixel text-[9px] sm:text-[10px] text-muted-foreground text-center uppercase tracking-[0.2em] sm:tracking-widest leading-loose max-w-xs sm:max-w-none">
            {t("rights")}
          </p>
        </div>
      </Container>
    </footer>
  );
}
