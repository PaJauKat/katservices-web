"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import caDataRaw from "@/data/final_data.json";

interface CAData {
  wiki_ca_id: number;
  name: string;
  tier: string;
  pts: number;
  monster: string;
  type: string;
  description: string;
  comp: number;
  custom_score: number | null;
  price: number | null;
  requirements?: {
    skills?: Array<{ skill: string; level: number }>;
    team_members?: { min?: number; max?: number; exact?: number };
  };
}

interface WikiData {
  username?: string;
  combat_achievements?: number[];
}

const caData = caDataRaw as CAData[];

function isTeamTask(ca: CAData): boolean {
  const tm = ca.requirements?.team_members;
  if (!tm) return false;
  return (
    (typeof tm.min === "number" && tm.min > 1) ||
    (typeof tm.max === "number" && tm.max > 1) ||
    (typeof tm.exact === "number" && tm.exact > 1)
  );
}

const teamTasks = caData.filter(isTeamTask);
const teamTaskIds = new Set(teamTasks.map((t) => t.wiki_ca_id));

const TiersCA: Record<string, number> = Object.freeze({
  EASY: 41,
  MEDIUM: 161,
  HARD: 419,
  ELITE: 1075,
  MASTER: 1945,
  GRANDMASTER: 2671,
});

const TierOrder: Record<string, number> = Object.freeze({
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
  ELITE: 4,
  MASTER: 5,
  GRANDMASTER: 6,
});

const tierKeys = ["EASY", "MEDIUM", "HARD", "ELITE", "MASTER", "GRANDMASTER"] as const;

const TIER_IMAGES: Record<string, string> = Object.freeze({
  EASY: "/images/ca-hilts/Ghommal_hilt_1.png",
  MEDIUM: "/images/ca-hilts/Ghommal_hilt_2.png",
  HARD: "/images/ca-hilts/Ghommal_hilt_3.png",
  ELITE: "/images/ca-hilts/Ghommal_hilt_4.png",
  MASTER: "/images/ca-hilts/Ghommal_hilt_5.png",
  GRANDMASTER: "/images/ca-hilts/Ghommal_hilt_6.png",
});

const TIER_OPTIONS = [
  { value: "EASY", label: "Easy (41 pts)" },
  { value: "MEDIUM", label: "Medium (161 pts)" },
  { value: "HARD", label: "Hard (419 pts)" },
  { value: "ELITE", label: "Elite (1,075 pts)" },
  { value: "MASTER", label: "Master (1,945 pts)" },
  { value: "GRANDMASTER", label: "Grandmaster (2,671 pts)" },
];

const TIER_PILLS = [
  { key: "ALL", label: "Todos los Tiers" },
  { key: "EASY", label: "Easy" },
  { key: "MEDIUM", label: "Medium" },
  { key: "HARD", label: "Hard" },
  { key: "ELITE", label: "Elite" },
  { key: "MASTER", label: "Master" },
  { key: "GRANDMASTER", label: "Grandmaster" },
];

const SORTABLE_COLS = [
  { key: "name", label: "TAREA", cls: "col-task" },
  { key: "monster", label: "BOSS", cls: "col-boss" },
  { key: "pts", label: "PTS", cls: "col-pts" },
  { key: "tier", label: "TIER", cls: "col-tier" },
  { key: null, label: "DESCRIPCIÓN", cls: "col-desc" },
  { key: "price", label: "PRECIO", cls: "col-price" },
];

function getTierOrder(tierKey: string): number {
  return TierOrder[tierKey] ?? 0;
}

function getCurrentTierKey(completedPts: number): string {
  for (let i = tierKeys.length - 1; i >= 0; i--) {
    const tierKey = tierKeys[i];
    if (completedPts >= (TiersCA[tierKey] ?? 0)) {
      return tierKey;
    }
  }
  return "Ninguno";
}

function getNextTierKey(currentTierKey: string): string {
  if (currentTierKey === "Ninguno") return "EASY";
  const currentIndex = tierKeys.indexOf(currentTierKey as (typeof tierKeys)[number]);
  if (currentIndex === -1 || currentIndex === tierKeys.length - 1) {
    return currentTierKey;
  }
  return tierKeys[currentIndex + 1];
}

function normalizeTargetTier(selectedTierKey: string, currentTierKey: string): string {
  if (currentTierKey === "Ninguno") return selectedTierKey;
  if (getTierOrder(selectedTierKey) < getTierOrder(currentTierKey)) {
    return getNextTierKey(currentTierKey);
  }
  return selectedTierKey;
}

function formatPrice(val: number): string {
  if (!val || val <= 0) return "0 GP";
  if (val >= 1000) return `${(val / 1000).toFixed(1)}B GP`;
  if (val >= 1) return `${val % 1 === 0 ? val : val.toFixed(1)}M GP`;
  return `${Math.round(val * 1000)}k GP`;
}

export default function CaTierCalculator() {
  const [rsn, setRsn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasResult, setHasResult] = useState(false);

  const [completedTasks, setCompletedTasks] = useState<CAData[]>([]);
  const [incompleteTasks, setIncompleteTasks] = useState<CAData[]>([]);
  const [suggestedTasks, setSuggestedTasks] = useState<CAData[]>([]);
  const [currentTier, setCurrentTier] = useState("Ninguno");
  const [targetTier, setTargetTier] = useState("MASTER");
  const [completedPts, setCompletedPts] = useState(0);
  const [targetTierPts, setTargetTierPts] = useState(TiersCA.MASTER);
  const [missingPts, setMissingPts] = useState(TiersCA.MASTER);
  const [totalPrice, setTotalPrice] = useState(0);

  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState("custom_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [mode, setMode] = useState<"suggested" | "no-do">("suggested");

  useEffect(() => {
    if (hasResult) {
      document
        .getElementById("ca-calc-results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hasResult]);

  const selectDisabled = (tierKey: string): boolean => {
    if (!hasResult) return false;
    return getTierOrder(tierKey) < getTierOrder(currentTier === "Ninguno" ? "EASY" : currentTier);
  };

  function updateSuggestions(tierKey: string, incomplete: CAData[], pts: number) {
    const targetPts = TiersCA[tierKey] ?? TiersCA.MASTER;
    const missing = Math.max(0, targetPts - pts);

    const sortedIncomplete = incomplete
      .filter((ca) => !teamTaskIds.has(ca.wiki_ca_id))
      .sort((a, b) => (b.custom_score ?? 0) - (a.custom_score ?? 0));
    let ptsAcc = 0;
    let price = 0;
    const nextSuggested: CAData[] = [];

    for (const ca of sortedIncomplete) {
      if (ptsAcc >= missing && missing > 0) break;
      ptsAcc += ca.pts;
      price += ca.price ?? 0;
      nextSuggested.push(ca);
    }

    setSuggestedTasks(nextSuggested);
    setTargetTierPts(targetPts);
    setMissingPts(missing);
    setTotalPrice(price);
  }

  const onTargetChange = (value: string) => {
    if (!hasResult || !value) return;
    const normalized = normalizeTargetTier(value, currentTier);
    setTargetTier(normalized);
    updateSuggestions(normalized, incompleteTasks, completedPts);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const rsnValue = rsn.trim();
    if (!rsnValue) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ username: rsnValue });
      const resp = await fetch(`/api/ca-tier?${params.toString()}`);

      if (!resp.ok) {
        const errData = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new Error(
          errData.error || `No se pudo encontrar al jugador '${rsnValue}'. (Status ${resp.status})`
        );
      }

      const data = (await resp.json()) as WikiData;
      const completedIds = new Set(data.combat_achievements ?? []);

      let pts = 0;
      const done: CAData[] = [];
      const pending: CAData[] = [];

      for (const ca of caData) {
        if (completedIds.has(ca.wiki_ca_id)) {
          pts += ca.pts;
          done.push(ca);
        } else {
          pending.push(ca);
        }
      }

      const current = getCurrentTierKey(pts);
      const defaultTarget = getNextTierKey(current);
      let selected = normalizeTargetTier(targetTier, current);
      if (getTierOrder(selected) < getTierOrder(current === "Ninguno" ? "EASY" : current)) {
        selected = getNextTierKey(current);
      }
      if (TiersCA[selected] === undefined) selected = defaultTarget;

      setCompletedTasks(done);
      setIncompleteTasks(pending);
      setCurrentTier(current);
      setTargetTier(selected);
      setCompletedPts(pts);
      updateSuggestions(selected, pending, pts);

      setSortKey("custom_score");
      setSortDir("desc");
      setMode("suggested");
      setHasResult(true);
    } catch (err) {
      console.error("Error fetching CA tier data:", err);
      setError(
        err instanceof Error ? err.message : "Ocurrió un error inesperado al consultar la API."
      );
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = Math.min(100, Math.round((completedPts / targetTierPts) * 100));

  const filtered = useMemo(() => {
    if (!hasResult) return [];

    const source = mode === "no-do" ? teamTasks : suggestedTasks;

    const list = source.filter((task) => {
      if (tierFilter !== "ALL" && task.tier.toUpperCase() !== tierFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !task.name.toLowerCase().includes(q) &&
          !task.monster.toLowerCase().includes(q) &&
          !task.type.toLowerCase().includes(q) &&
          !task.description.toLowerCase().includes(q) &&
          !task.tier.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      if (sortKey === "tier") {
        return (getTierOrder(a.tier.toUpperCase()) - getTierOrder(b.tier.toUpperCase())) * dir;
      }
      const va = a[sortKey as keyof CAData];
      const vb = b[sortKey as keyof CAData];
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * dir;
      }
      if (sortKey === "price" || sortKey === "custom_score") {
        return (((va as number | null) ?? 0) - ((vb as number | null) ?? 0)) * dir;
      }
      return String(va ?? "").localeCompare(String(vb ?? "")) * dir;
    });
  }, [hasResult, mode, suggestedTasks, tierFilter, search, sortKey, sortDir]);

  const listTotal = mode === "no-do" ? teamTasks.length : suggestedTasks.length;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "price" || key === "pts" ? "desc" : "asc");
    }
  };

  return (
    <>
      <div className="calc-card">
        <div className="card-glow"></div>
        <form onSubmit={handleSubmit} className="calc-form-grid">
          <div className="calc-field">
            <label htmlFor="calc-rsn-input">Nombre de usuario (RSN)</label>
            <div className="input-wrapper">
              <svg
                className="input-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="calc-rsn-input"
                name="username"
                type="text"
                value={rsn}
                onChange={(e) => setRsn(e.target.value)}
                placeholder="Ej: Zezima..."
                autoComplete="off"
                required
              />
            </div>
          </div>

          <div className={`calc-field ${hasResult ? "" : "hidden"}`}>
            <label htmlFor="calc-target-tier">Tier Objetivo</label>
            <div className="select-wrapper">
              <select
                id="calc-target-tier"
                value={targetTier}
                onChange={(e) => onTargetChange(e.target.value)}
              >
                {TIER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={selectDisabled(opt.value)}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <svg
                className="select-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-calc" disabled={loading}>
              {loading ? <span className="spinner"></span> : <span>⚡</span>}
              <span>{loading ? "Buscando..." : "Obtener info"}</span>
            </button>
          </div>
        </form>
        <div className="calc-footer-note">
          <span className="note-icon">ℹ️</span>
          <span>Sincronizado automáticamente con los datos oficiales de RuneLite y RuneScape Wiki API.</span>
        </div>
      </div>

      {error && (
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <div className="error-body">
            <h4>No se pudieron consultar los datos</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      <div id="ca-calc-results">
        {hasResult && (
          <div className="kpi-grid">
            <div className="kpi-card kpi-card-tier">
              <div className="kpi-header">
                <span className="kpi-label">Current Tier</span>
                <span className="kpi-icon">🏅</span>
              </div>
              <div className="kpi-tier-content">
                <Image
                  className="kpi-tier-image"
                  src={TIER_IMAGES[currentTier] ?? TIER_IMAGES.EASY}
                  alt={`Ghommal hilt de tier ${currentTier}`}
                  width={64}
                  height={64}
                />
                <div className="kpi-value-row">
                  <span className="kpi-value">{currentTier}</span>
                </div>
              </div>
              <span className="kpi-footer-text">Tier actual según puntos completados</span>
            </div>

            <div className="kpi-card kpi-card-target">
              <div className="kpi-header">
                <span className="kpi-label">Puntos Faltantes</span>
                <Image
                  className="kpi-target-hilt"
                  src={TIER_IMAGES[targetTier] ?? TIER_IMAGES.GRANDMASTER}
                  alt={`Ghommal hilt de tier ${targetTier}`}
                  width={44}
                  height={44}
                />
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value highlight-red">{missingPts.toLocaleString()}</span>
                <span className="kpi-subvalue">PTS</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>
              {missingPts > 0 ? (
                <span className="kpi-missing-warning">
                  ⚠️ Te faltan {missingPts.toLocaleString()} PTS para alcanzar {targetTier}
                </span>
              ) : (
                <span className="kpi-missing-ok">✅ Tier {targetTier} alcanzado</span>
              )}
              <span className="kpi-footer-text">
                {completedPts.toLocaleString()} / {targetTierPts.toLocaleString()} PTS completados
                {suggestedTasks.length > 0 && ` · ${suggestedTasks.length} tareas sugeridas`}
              </span>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Costo Estimado</span>
                <span className="kpi-icon">💰</span>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value">{formatPrice(totalPrice)}</span>
              </div>
              <span className="kpi-footer-text">En suministros / servicios recomendados</span>
            </div>
          </div>
        )}

        {hasResult && (
          <section className="results-section">
            <div className="toolbar-card">
              <div className="toolbar-top">
                <div className="table-search-input">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por tarea, boss o descripción..."
                  />
                </div>

                <div className="mode-tabs">
                  <button
                    type="button"
                    className={`mode-tab ${mode === "suggested" ? "active" : ""}`}
                    onClick={() => setMode("suggested")}
                  >
                    Sugeridas
                  </button>
                  <button
                    type="button"
                    className={`mode-tab ${mode === "no-do" ? "active" : ""}`}
                    onClick={() => setMode("no-do")}
                  >
                    No hago
                  </button>
                </div>
              </div>

              <div className="tier-filters">
                {TIER_PILLS.map((pill) => (
                  <button
                    key={pill.key}
                    className={`tier-pill-btn ${pill.key.toLowerCase()} ${tierFilter === pill.key ? "active" : ""}`}
                    data-tier={pill.key}
                    onClick={() => setTierFilter(pill.key)}
                  >
                    {pill.key !== "ALL" && <span className="dot"></span>}
                    {pill.label}
                  </button>
                ))}
              </div>

              <div className="counter-bar">
                <span>
                  Mostrando <strong>{filtered.length.toLocaleString()}</strong> de{" "}
                  <strong>{listTotal.toLocaleString()}</strong> tareas
                </span>
              </div>
            </div>

            <div className="table-card">
              <div className="table-wrapper">
                <table className="ca-table">
                  <thead>
                    <tr>
                      {SORTABLE_COLS.map((col) => (
                        <th
                          key={col.cls}
                          className={`${col.cls} ${col.key ? "sortable" : ""} ${col.key && sortKey === col.key ? sortDir : ""}`}
                          data-key={col.key ?? undefined}
                          onClick={col.key ? () => handleSort(col.key) : undefined}
                        >
                          <span>{col.label}</span>
                          {col.key && <span className="sort-icon"></span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((ca) => {
                      const tierClass = ca.tier.toLowerCase();
                      return (
                        <tr key={ca.wiki_ca_id}>
                          <td className="col-task">
                            <div className="task-cell">
                              <span className="task-name">{ca.name}</span>
                            </div>
                          </td>
                          <td className="col-boss">
                            <span className="boss-pill">{ca.monster || "General"}</span>
                          </td>
                          <td className="col-pts">
                            <span className="pts-badge">+{ca.pts}</span>
                          </td>
                          <td className="col-tier">
                            <span className={`tier-pill ${tierClass}`}>
                              <span className="dot"></span>
                              {ca.tier}
                            </span>
                          </td>
                          <td className="col-desc">
                            <p className="desc-text">{ca.description}</p>
                          </td>
                          <td className="col-price">
                            {mode === "no-do" || ca.price == null ? (
                              <span className="price-pill no-price">—</span>
                            ) : (
                              <span
                                className={`price-pill ${ca.price > 0 ? "has-price" : "free"}`}
                              >
                                {formatPrice(ca.price)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={`empty-state ${filtered.length === 0 ? "" : "hidden"}`}>
                <div className="empty-icon">🔍</div>
                <h3>No se encontraron tareas</h3>
                <p>No hay logros que coincidan con la búsqueda o filtro seleccionado.</p>
              </div>
            </div>
          </section>
        )}

        {!hasResult && (
          <div className="placeholder-card">
            <div className="placeholder-icon">🛡️</div>
            <h3>Consulta tu progreso de Combat Achievements</h3>
            <p>
              Escribe tu usuario arriba y haz clic en <strong>Calcular Tareas</strong> para ver tu
              informe detallado de progreso, faltantes y costo estimado.
            </p>
          </div>
        )}
      </div>
    </>
  );
}