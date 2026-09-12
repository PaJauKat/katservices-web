import type { GearItem, GearModification } from "@/data/gear";
import { gearMeta } from "@/data/gear-meta";

/**
 * Central price data: github.com/PaJauKat/kat-data
 * items.json holds ONLY pricing + modifiers (prices in millions of GP).
 * All presentation (descriptions, images, requirements, reference screenshots)
 * lives locally in data/gear-meta.ts and is merged in below.
 */
const ITEMS_URL = "https://raw.githubusercontent.com/PaJauKat/kat-data/main/items.json";

interface RawModOption {
  id: string;
  label: string;
  addGP: number;
}

interface RawModification {
  id: string;
  label?: string;
  options?: RawModOption[];
  addGP?: number;
}

interface RawItem {
  slug: string;
  Item: string;
  /** Base price in millions of GP (e.g. 15 = 15M). */
  intPrice: number;
  modifications?: RawModification[];
}

const toGp = (millions: number): number => Math.round(millions * 1_000_000);

/** True when the icon field is an image URL (/path or http) instead of an emoji. */
export function iconIsImage(icon: string): boolean {
  return icon.startsWith("/") || icon.startsWith("http");
}

function toModification(raw: RawModification): GearModification {
  if (raw.options) {
    return {
      id: raw.id,
      label: raw.label,
      options: raw.options.map((o) => ({
        id: o.id,
        label: o.label,
        addGP: toGp(o.addGP),
      })),
    };
  }
  return {
    id: raw.id,
    label: raw.label ?? raw.id,
    addGP: toGp(raw.addGP ?? 0),
  };
}

export let gearItems: GearItem[] = [];

let itemsPromise: Promise<RawItem[]> | null = null;

function loadItems(): Promise<RawItem[]> {
  itemsPromise ??= fetchItems().catch((err) => {
    itemsPromise = null;
    throw err;
  });
  return itemsPromise;
}

async function fetchItems(): Promise<RawItem[]> {
  const res = await fetch(ITEMS_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load items from kat-data (HTTP ${res.status})`);
  }
  return (await res.json()) as RawItem[];
}

export async function initGear() {
  const raw = await loadItems();
  const items = raw.map((r) => {
    const meta = gearMeta[r.slug];
    return {
      slug: r.slug,
      name: r.Item,
      icon: meta?.icon ?? "⚔️",
      image: meta?.image,
      references: meta?.references,
      tagline: meta?.tagline ?? r.Item,
      description: meta?.description ?? `We deliver ${r.Item} with a complete, clean run.`,
      basePriceGP: toGp(r.intPrice),
      requirements:
        meta?.requirements ?? ["You must be online for the in-game trade delivery"],
      modifications: (r.modifications ?? []).map(toModification),
    } as GearItem;
  });
  gearItems.splice(0, gearItems.length, ...items);
}

export async function getGearBySlug(slug: string): Promise<GearItem | undefined> {
  await initGear();
  return gearItems.find((g) => g.slug === slug);
}