import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { gearItems, getGearBySlug, initGear } from "@/lib/gear";
import GearPageClient from "@/components/GearPageClient";
import { STORE } from "@/lib/config";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  await initGear();
  return gearItems.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getGearBySlug(slug);
  if (!item) {
    return { title: `${STORE.name} | OSRS services` };
  }
  return { title: `${item.name} | ${STORE.name}`, description: item.tagline };
}

export default async function GearSlugPage({ params }: Props) {
  const { slug } = await params;
  const item = await getGearBySlug(slug);
  if (!item) notFound();

  return <GearPageClient item={item} />;
}