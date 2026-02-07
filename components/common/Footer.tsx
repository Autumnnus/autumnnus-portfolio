import { useTranslations } from "next-intl";
import Container from "./Container";

export default function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="border-t-4 border-border bg-card mt-20">
      <Container className="py-8">
        <div className="flex flex-col items-center gap-4">
          <p className="font-pixel text-xs text-muted-foreground text-center">
            {t("rights")}
          </p>
        </div>
      </Container>
    </footer>
  );
}
