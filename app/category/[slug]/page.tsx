import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { initCatalog, getGroupBySlug, getGroupContentOrder, groups } from "@/lib/services";
import { categoryImages } from "@/data/categoryImages";
import ServiceRow from "@/components/ServiceRow";
import { STORE } from "@/lib/config";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  await initCatalog();
  return groups.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await initCatalog();
  const group = getGroupBySlug(slug);
  if (!group) return { title: `${STORE.name} | OSRS services` };
  return { title: `${group.option} | ${STORE.name}`, description: `Buy ${group.option} services in OSRS.` };
}

export default async function CategoryPage({ params }: Props) {
  await initCatalog();
  const { slug } = await params;
  const group = getGroupBySlug(slug);
  if (!group) notFound();

  const contentOrder = getGroupContentOrder(group);
  const bannerImg = categoryImages[group.option];

  return (
    <>
      <Link href="/combat-achievements" className="back-link">
        <span>←</span> All categories
      </Link>

      <div className="category-hero">
        {bannerImg && (
          <div className="category-hero-img">
            <Image src={bannerImg} alt={group.option} fill sizes="180px" className="category-hero-render" />
          </div>
        )}
        <div className="category-hero-info">
          <div className="header-badge">SERVICE CATALOG</div>
          <h1 className="section-title">{group.option}</h1>
          <p className="section-sub">
            {group.items.length} services · Prices in OSRS GP. Add tasks to your cart to build an
            order.
          </p>
        </div>
      </div>

      {contentOrder.map((content) => {
        const items = group.items.filter((it) => (it.content ?? "Default") === content);
        return (
          <div className="content-group" key={content}>
            <div className="content-group-title">
              <h3>{content === "Default" ? "All tasks" : content}</h3>
              {content !== "Default" && <span className="tier-chip">{content}</span>}
            </div>
            {items.map((item) => (
              <ServiceRow key={item.id} item={item} />
            ))}
          </div>
        );
      })}
    </>
  );
}