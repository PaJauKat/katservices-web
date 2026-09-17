import type { Metadata } from "next";
import { services, initCatalog } from "@/lib/services";
import CombatAchievementsViewer from "@/components/CombatAchievementsViewer";
import KillCountLookup from "@/components/KillCountLookup";
import { STORE } from "@/lib/config";

export const metadata: Metadata = {
  title: `Combat Achievements | ${STORE.name}`,
  description:
    "All OSRS Combat Achievement services in one place, from boss fights to Grandmaster tiers.",
};

export const dynamic = "force-static";

export default async function CombatAchievementsPage() {
  await initCatalog();

  return (
    <>
      <div className="ca-header">
        <div className="header-badge">SERVICE CATALOG</div>
        <h1 className="ca-title">
          Combat Achievements <span className="highlight-red">⚔️</span>
        </h1>
        <p className="section-sub">
          {services.length} services across all monsters. Search, filter by boss and add tasks
          straight to your cart.
        </p>
        <KillCountLookup />
      </div>

      <CombatAchievementsViewer items={services} />
    </>
  );
}