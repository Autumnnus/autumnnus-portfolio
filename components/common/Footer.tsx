import VisitorTracker from "@/components/interactive/VisitorTracker";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import Container from "./Container";
import VisitorBadge from "./VisitorBadge";
import VisitorBadgeLoading from "./VisitorBadgeLoading";

export default async function Footer() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Footer" });

  return (
    <footer className="border-t-4 border-border bg-card mt-20">
      <VisitorTracker />
      <Container className="py-8">
        <div className="flex flex-col items-center gap-6">
          <Suspense fallback={<VisitorBadgeLoading />}>
            <VisitorBadge locale={locale} />
          </Suspense>
          <p className="font-pixel text-[10px] text-muted-foreground text-center uppercase tracking-widest leading-loose">
            {t("rights")}
          </p>
        </div>
      </Container>
    </footer>
  );
}
