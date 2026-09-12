"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useShop } from "@/components/ShopProvider";
import { iconIsImage } from "@/lib/gear";
import { formatIntPrice } from "@/lib/services";
import type { GearImage, GearItem, GearModGroup, GearModification } from "@/data/gear";

function isGroup(mod: GearModification): mod is GearModGroup {
  return "options" in mod;
}

function groupTitle(mod: GearModGroup): string {
  if (mod.label) return mod.label;
  return mod.id.charAt(0).toUpperCase() + mod.id.slice(1);
}

export default function GearPageClient({ item }: { item: GearItem }) {
  const { addGearToCart, toast } = useShop();
  const [toggled, setToggled] = useState<string[]>([]);
  const [groupSel, setGroupSel] = useState<Record<string, string>>({});
  const [activeRef, setActiveRef] = useState<GearImage | null>(null);

  const toggle = (id: string) =>
    setToggled((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const selectGroupOption = (groupId: string, optionId: string) =>
    setGroupSel((prev) =>
      prev[groupId] === optionId
        ? { ...prev, [groupId]: "" }
        : { ...prev, [groupId]: optionId }
    );

  const { totalGP, note, modKey } = useMemo(() => {
    let total = item.basePriceGP;
    const noteParts: string[] = [];
    const ids: string[] = [];

    for (const mod of item.modifications) {
      if (isGroup(mod)) {
        const optId = groupSel[mod.id];
        if (optId) {
          const opt = mod.options.find((o) => o.id === optId);
          if (opt) {
            total += opt.addGP;
            ids.push(opt.id);
            noteParts.push(`${groupTitle(mod)}: ${opt.label}`);
          }
        }
      } else if (toggled.includes(mod.id)) {
        total += mod.addGP;
        ids.push(mod.id);
        noteParts.push(mod.label);
      }
    }

    return {
      totalGP: total,
      note: noteParts.length ? noteParts.join(", ") : null,
      modKey: ids.sort().join("+"),
    };
  }, [item, groupSel, toggled]);

  const handleAdd = () => {
    addGearToCart(item, note, modKey, totalGP);
    toast(
      <>
        Added to cart: <span className="accent">{item.name}</span>
      </>
    );
  };

  return (
    <>
      <Link href="/#gear" className="back-link">
        <span>←</span> All gear
      </Link>

      <div className="gear-page-header">
        <div className="gear-icon-lg">
          {iconIsImage(item.icon) ? (
            <Image
              src={item.icon}
              alt={item.name}
              width={64}
              height={64}
              className="gear-icon-img"
            />
          ) : (
            <span className="gear-icon-emoji">{item.icon}</span>
          )}
        </div>
        <div>
          <div className="header-badge">FEATURED GEAR</div>
          <h1 className="gear-title">{item.name}</h1>
          <p className="gear-tagline">{item.tagline}</p>
        </div>
      </div>

      {item.image && (
        <div className="gear-product-art">
          <div className="gear-art-canvas">
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 900px) 100vw, 420px"
              className="gear-art-img"
            />
          </div>
        </div>
      )}

      <p className="gear-description">{item.description}</p>

      <div className="gear-block">
        <h3>Requirements</h3>
        <div className="req-list">
          {item.requirements.map((req) => (
            <div className="req-item" key={req}>
              <span className="req-mark">✓</span>
              <span>{req}</span>
            </div>
          ))}
        </div>
      </div>

      {item.modifications.length > 0 && (
        <div className="gear-block">
          <h3>Price modifiers</h3>
          <p className="gear-block-hint">
            Optional add-ons that change the final price. Pick one option per group; toggle
            standalone modifiers freely.
          </p>
          <div className="mod-list">
            {item.modifications.map((mod) =>
              isGroup(mod) ? (
                <div className="mod-group" key={mod.id}>
                  <div className="mod-group-title">{groupTitle(mod)}</div>
                  {mod.options.map((opt) => {
                    const isSelected = groupSel[mod.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        className={`mod-option${isSelected ? " selected" : ""}`}
                        onClick={() => selectGroupOption(mod.id, opt.id)}
                        aria-pressed={isSelected}
                      >
                        <span className="mod-label">
                          <span className={`mod-radio${isSelected ? " checked" : ""}`} />
                          <span>{opt.label}</span>
                        </span>
                        <span className="mod-add">
                          {opt.addGP === 0
                            ? "included"
                            : `+${formatIntPrice(opt.addGP)} GP`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <button
                  key={mod.id}
                  className={`mod-option${toggled.includes(mod.id) ? " selected" : ""}`}
                  onClick={() => toggle(mod.id)}
                  aria-pressed={toggled.includes(mod.id)}
                >
                  <span className="mod-label">
                    <span
                      className={`mod-check${toggled.includes(mod.id) ? " checked" : ""}`}
                    >
                      {toggled.includes(mod.id) ? "✓" : ""}
                    </span>
                    <span>{mod.label}</span>
                  </span>
                  <span className="mod-add">
                    {mod.addGP === 0 ? "included" : `+${formatIntPrice(mod.addGP)} GP`}
                  </span>
                </button>
              )
            )}
          </div>
        </div>
      )}

      {item.references && item.references.length > 0 && (
        <div className="gear-block">
          <h3>Setup references</h3>
          <p className="gear-block-hint">
            Reference screenshots of gear setups. Click to view full size.
          </p>
          <div className="ref-grid">
            {item.references.map((ref, i) => (
              <button
                key={ref.src}
                className="ref-card"
                onClick={() => setActiveRef(ref)}
                aria-label={ref.desc}
              >
                <img src={ref.src} alt={ref.desc} loading="lazy" className="ref-img" /> {/* eslint-disable-line @next/next/no-img-element -- reference shots with mixed aspect ratios */}
                <span className="ref-label">Setup {i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="gear-total-row">
        <span className="gear-total-label">Total</span>
        <span className="gear-total-value">{formatIntPrice(totalGP)} GP</span>
      </div>

      <div className="gear-actions">
        <button className="btn btn-gold btn-lg" onClick={handleAdd}>
          <span>+ Add to cart</span>
        </button>
        <p className="gear-note">
          Payment is arranged in game in OSRS GP. Delivery via in-game trade, confirmed on
          Discord.
        </p>
      </div>

      {activeRef && (
        <div className="ref-modal-backdrop" onClick={() => setActiveRef(null)}>
          <div className="ref-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="ref-modal-close"
              onClick={() => setActiveRef(null)}
              aria-label="Close reference"
            >
              ✕
            </button>
            <img src={activeRef.src} alt={activeRef.desc} className="ref-modal-img" /> {/* eslint-disable-line @next/next/no-img-element -- reference shot */}
            <p className="ref-modal-desc">{activeRef.desc}</p>
          </div>
        </div>
      )}
    </>
  );
}