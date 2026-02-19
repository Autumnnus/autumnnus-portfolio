import VisitorTracker from "@/components/interactive/VisitorTracker";
import { getTranslations } from "next-intl/server";
import Container from "./Container";
import VisitorBadge from "./VisitorBadge";

export default async function Footer() {
  const t = await getTranslations("Footer");

  return (
    <footer className="border-t-4 border-border bg-card mt-20">
      <VisitorTracker />
      <Container className="py-8">
        <div className="flex flex-col items-center gap-6">
          <VisitorBadge />
          <p className="font-pixel text-[10px] text-muted-foreground text-center uppercase tracking-widest leading-loose">
            {t("rights")}
          </p>
        </div>
      </Container>
    </footer>
  );
}
