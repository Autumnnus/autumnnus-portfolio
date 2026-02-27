import { getWorkExperiences } from "@/app/actions";
import Container from "@/components/common/Container";
import WorkCard from "@/components/work/WorkCard";
import { LanguageType as Language } from "@/lib/db/schema";
import { WorkExperience } from "@/types/contents";
import * as Separator from "@radix-ui/react-separator";
import { getTranslations } from "next-intl/server";

export default async function WorkPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Work" });
  const experiences = (await getWorkExperiences(
    locale as Language,
  )) as unknown as WorkExperience[];

  return (
    <Container className="py-12 sm:py-20">
      {/* Page Header */}
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {t("description")}
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="flex items-baseline gap-3 mb-8">
          <h2 className="text-2xl font-bold">{t("allExperiences")}</h2>
          <span className="text-muted-foreground text-sm">
            ({experiences.length} {t("experienceCount")})
          </span>
        </div>

        {/* List */}
        <div className="space-y-8">
          {experiences.map((experience, index) => (
            <div key={experience.company + index}>
              <WorkCard experience={experience} />
              {index < experiences.length - 1 && (
                <Separator.Root className="h-px bg-border/30 my-8 w-full" />
              )}
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
