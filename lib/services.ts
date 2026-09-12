import type { ServiceGroup, ServiceItem } from "@/lib/types";

/**
 * Central price/data source: github.com/PaJauKat/kat-data
 * combat_achivements.json (sic) is fetched at build/dev time.
 */
const COMBAT_ACHIEVEMENTS_URL =
  "https://raw.githubusercontent.com/PaJauKat/kat-data/main/combat_achivements.json";

interface RawService {
  name: string;
  tier: string;
  monster: string;
  description: string | null;
  /** Price in millions of GP (e.g. 12.5 = 12.5M). */
  price: number;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatIntPrice(n: number): string {
  if (n < 1_000_000) {
    const k = Math.round(n / 1_000);
    return `${k.toLocaleString("en-US")}K`;
  }
  const millions = Math.round((n / 1_000_000) * 10) / 10;
  const isWhole = Number.isInteger(millions);
  if (isWhole) {
    return `${millions.toLocaleString("en-US", { maximumFractionDigits: 0 })}M`;
  }
  return `${millions.toLocaleString("en-US", { maximumFractionDigits: 1 })}M`;
}

function toGp(millions: number): number {
  return Math.round(millions * 1_000_000);
}

function stableId(monster: string, name: string): string {
  return `${slugify(monster)}--${slugify(name)}`;
}

async function fetchCombatAchievements(): Promise<RawService[]> {
  const res = await fetch(COMBAT_ACHIEVEMENTS_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `Failed to load combat achievements from kat-data (HTTP ${res.status})`
    );
  }
  return (await res.json()) as RawService[];
}

export const services: ServiceItem[] = [];
export const groups: ServiceGroup[] = [];

let catalogPromise: Promise<RawService[]> | null = null;

function loadRaw(): Promise<RawService[]> {
  catalogPromise ??= fetchCombatAchievements().catch((err) => {
    catalogPromise = null;
    throw err;
  });
  return catalogPromise;
}

export async function initCatalog() {
  const raw = await loadRaw();

  const items: ServiceItem[] = raw.map((s) => ({
    id: stableId(s.monster, s.name),
    menu: "Combat Achievement",
    option: s.monster,
    content: s.tier,
    text: s.name,
    description: s.description,
    priceLabel: formatIntPrice(toGp(s.price)),
    intPrice: toGp(s.price),
  }));

  const map = new Map<string, ServiceItem[]>();
  for (const item of items) {
    const list = map.get(item.option) ?? [];
    list.push(item);
    map.set(item.option, list);
  }

  services.splice(0, services.length, ...items);
  groups.splice(
    0,
    groups.length,
    ...Array.from(map.entries()).map(([option, optionItems]) => ({
      option,
      slug: slugify(option),
      items: optionItems,
    }))
  );
}

const TIER_ORDER = ["Easy", "Medium", "Hard", "Elite", "Master", "Grandmaster"];

export function getGroupBySlug(slug: string): ServiceGroup | undefined {
  return groups.find((g) => g.slug === slug);
}

export function getGroupContentOrder(group: ServiceGroup): string[] {
  const order: string[] = [];
  const seen = new Set<string>();
  const sorted = [...group.items].sort((a, b) => {
    const ia = TIER_ORDER.indexOf(a.content ?? "Default");
    const ib = TIER_ORDER.indexOf(b.content ?? "Default");
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  for (const item of sorted) {
    const key = item.content ?? "Default";
    if (!seen.has(key)) {
      seen.add(key);
      order.push(key);
    }
  }
  return order;
}