import { getAboutStats, getVisitorMilestones } from "@/app/actions";
import { getTranslations } from "next-intl/server";
import VisitorBadgeClient from "./VisitorBadgeClient";

export default async function VisitorBadge({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Footer" });
  const stats = await getAboutStats();
  const milestones = await getVisitorMilestones();
  return (
    <VisitorBadgeClient
      count={stats.visitorCount}
      locale={locale}
      label={t("visitorLabel")}
      milestonesTitle={t("milestonesTitle")}
      lockedLabel={t("locked")}
      milestones={milestones
        .filter((c) => c.count <= stats.visitorCount)
        .map((c) => ({
          ...c,
          reachedAt: c.reachedAt.toISOString(),
        }))}
      tierNames={{
        FallenLeaf: t("tiers.FallenLeaf"),
        Amber: t("tiers.Amber"),
        HarvestWind: t("tiers.HarvestWind"),
        GoldenOak: t("tiers.GoldenOak"),
        CrimsonForest: t("tiers.CrimsonForest"),
        AutumnStorm: t("tiers.AutumnStorm"),
        Phoenix: t("tiers.Phoenix"),
        SeasonLord: t("tiers.SeasonLord"),
        FirstFrost: t("tiers.FirstFrost"),
        FrozenTrail: t("tiers.FrozenTrail"),
        Blizzard: t("tiers.Blizzard"),
        IceCrystal: t("tiers.IceCrystal"),
        Aurora: t("tiers.Aurora"),
        Glacier: t("tiers.Glacier"),
        PolarStar: t("tiers.PolarStar"),
        EternalWinter: t("tiers.EternalWinter"),
      }}
    />
  );
}
