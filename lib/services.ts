import finalDataRaw from "@/data/final_data.json";
import type { ServiceGroup, ServiceItem } from "@/lib/types";
import { countTaskPrice, getBossBaseGP } from "@/lib/pricing";

/**
 * Catalogo central: data/final_data.json (datos completos de kat-data:
 * combate achievements con type, kills, requirements...).
 * La tienda usa este archivo local para no depender de red en build y para
 * incluir el parametro `kills` de las tasks Kill Count.
 */

interface RawService {
  name: string;
  tier: string;
  monster: string;
  type?: string | null;
  description: string | null;
  /** Precio en millones de GP (puede ser null en tasks Kill Count). */
  price: number | null;
  kills?: number | null;
  wiki_ca_id?: number | null;
  also_completes?: string[] | null;
}

const finalData = finalDataRaw as RawService[];

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

function isCount(s: RawService): boolean {
  return (
    (s.type === "Kill Count" || s.type === "Stamina" || s.type === "Speed") &&
    s.kills != null &&
    s.kills > 0
  );
}

function staticIntPrice(s: RawService): number {
  return s.price != null ? toGp(s.price) : 0;
}

/**
 * Precio "full" de una task count (Kill Count / Stamina) sin descontar
 * hiscore: base del boss x kills que pide. Si el boss no tiene base en
 * bosses-prices.json se usa el precio estatico de final_data.json.
 */
export function countTaskFullPrice(s: RawService): number {
  return countTaskPrice(s.monster, s.type, s.kills, 0) ?? staticIntPrice(s);
}

export const services: ServiceItem[] = [];
export const groups: ServiceGroup[] = [];

export async function initCatalog(): Promise<void> {
  const items: ServiceItem[] = finalData.map((s) => {
    const dynamicPrice = isCount(s) && getBossBaseGP(s.monster) > 0;
    const intPrice = dynamicPrice ? countTaskFullPrice(s) : staticIntPrice(s);
    return {
      id: stableId(s.monster, s.name),
      menu: "Combat Achievement",
      option: s.monster,
      content: s.tier,
      text: s.name,
      description: s.description,
      priceLabel: formatIntPrice(intPrice),
      intPrice,
      type: s.type,
      kills: s.kills,
      wikiCaId: s.wiki_ca_id,
      alsoCompletes: s.also_completes,
      dynamicPrice,
    };
  });

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