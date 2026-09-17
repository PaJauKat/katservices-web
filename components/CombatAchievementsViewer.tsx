"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import ServiceRow from "@/components/ServiceRow";
import { categoryImages } from "@/data/categoryImages";
import type { ServiceItem } from "@/lib/types";

const TIER_ORDER = ["Easy", "Medium", "Hard", "Elite", "Master", "Grandmaster"];

export default function CombatAchievementsViewer({ items }: { items: ServiceItem[] }) {
  const [query, setQuery] = useState("");
  const [monster, setMonster] = useState("");
  const [onlyOthers, setOnlyOthers] = useState(false);

  const monsters = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of items) {
      counts.set(it.option, (counts.get(it.option) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const othersSet = useMemo(() => new Set(monsters.filter((m) => m.count === 1).map((m) => m.name)), [monsters]);

  const q = query.trim().toLowerCase();
  const browseMode = !q && !monster && !onlyOthers;

  const filtered = useMemo(() => {
    if (browseMode) return [];
    return items.filter((it) => {
      if (onlyOthers && !othersSet.has(it.option)) return false;
      if (monster && it.option !== monster) return false;
      if (!q) return true;
      return (
        it.text.toLowerCase().includes(q) ||
        it.option.toLowerCase().includes(q) ||
        (it.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, q, monster, onlyOthers, othersSet, browseMode]);

  const tierGroups = useMemo(() => {
    const map = new Map<string, ServiceItem[]>();
    for (const it of filtered) {
      const key = it.content ?? "Default";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    const order = TIER_ORDER.filter((k) => map.has(k));
    for (const k of map.keys()) {
      if (!order.includes(k)) order.push(k);
    }
    return order.map((tier) => ({ tier, services: map.get(tier)! }));
  }, [filtered]);

  const reset = () => {
    setQuery("");
    setMonster("");
    setOnlyOthers(false);
  };

  const selectMonster = (name: string) => {
    setOnlyOthers(false);
    setMonster(name);
  };

  const selectOthers = () => {
    setMonster("");
    setQuery("");
    setOnlyOthers(true);
  };

  const monstersWithMore = monsters.filter((m) => m.count > 1);
  const others = monsters.filter((m) => m.count === 1);
  const othersTotal = others.reduce((acc, m) => acc + m.count, 0);

  return (
    <>
      <div className="ca-toolbar">
        <div className="ca-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M19 7.5a4.7 4.7 0 0 0 2 4.7-4.7a4.7 4.7 0 0 0-2-4.7" transform="rotate(45 16.5 16.5)" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search achievements, bosses, tasks..."
            aria-label="Search combat achievements"
          />
        </div>

        <div className="ca-select-wrap">
          <select
            className="ca-select"
            value={monster}
            onChange={(e) => selectMonster(e.target.value)}
            aria-label="Filter by monster"
          >
            <option value="">All monsters ({items.length})</option>
            {monsters.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name} ({m.count})
              </option>
            ))}
          </select>
          <svg className="ca-select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M6 9l4.5 4.5M10 13.5h4.5" />
          </svg>
        </div>

        {(query || monster || onlyOthers) && (
          <button className="ca-clear" onClick={reset}>
            Clear
          </button>
        )}
      </div>

      {(query || monster || onlyOthers) && (
        <button className="ca-clear-back" onClick={reset}>
          <span aria-hidden="true">←</span>
          Back to all services
        </button>
      )}

      {browseMode ? (
        <>
          <div className="ca-monster-grid">
            {monstersWithMore.map((m) => {
              const img = categoryImages[m.name];
              return (
                <button
                  key={m.name}
                  className="ca-monster-card"
                  onClick={() => selectMonster(m.name)}
                >
                  {img ? (
                    <Image src={img} alt="" width={64} height={64} className="ca-monster-img" />
                  ) : (
                    <span className="ca-monster-emoji">⚔️</span>
                  )}
                  <span className="ca-monster-name">{m.name}</span>
                  <span className="ca-monster-count">
                    {m.count} {m.count === 1 ? "service" : "services"}
                  </span>
                </button>
              );
            })}
            {others.length > 0 && (
              <button
                className="ca-monster-card"
                onClick={selectOthers}
              >
                <span className="ca-monster-emoji">🗂️</span>
                <span className="ca-monster-name">Others ({others.length})</span>
                <span className="ca-monster-count">
                  {othersTotal} {othersTotal === 1 ? "service" : "services"}
                </span>
              </button>
            )}
          </div>
        </>
      ) : filtered.length === 0 ? (
        <div className="ca-empty">
          <div className="ca-empty-icon">🔍</div>
          <p>No services match your search.</p>
          <button className="btn btn-secondary" onClick={reset}>
            Reset filters
          </button>
        </div>
      ) : (
        <>
          <div className="ca-results-head">
            <span>
              {filtered.length} {filtered.length === 1 ? "service" : "services"}
            </span>
            {onlyOthers && <span className="ca-results-chip">Others</span>}
            {monster && <span className="ca-results-chip">{monster}</span>}
            {q && <span className="ca-results-chip">&quot;{query.trim()}&quot;</span>}
          </div>

          {tierGroups.map((g) => (
            <div className="content-group" key={g.tier}>
              <div className="content-group-title">
                <h3>{g.tier}</h3>
                <span className="tier-chip">{g.tier}</span>
              </div>
              {g.services.map((it) => (
                <ServiceRow key={it.id} item={it} />
              ))}
            </div>
          ))}
        </>
      )}
    </>
  );
}