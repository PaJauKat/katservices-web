"use client";

import { useState } from "react";
import { useShop } from "@/components/ShopProvider";

const MAX_CHIPS = 4;

export default function KillCountLookup() {
  const {
    rsn,
    killCounts,
    completedTaskIds,
    killsStatus,
    killsError,
    lookupPlayer,
    forgetKills,
    toast,
  } = useShop();
  const [input, setInput] = useState(rsn);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await lookupPlayer(input);
    toast(
      result.ok
        ? "Player data loaded: kills and completed tasks updated."
        : (result.error ?? "Player lookup failed.")
    );
  };

  const ranked = Object.entries(killCounts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="kc-lookup">
      <form onSubmit={submit} className="kc-lookup-form">
        <label className="kc-lookup-label" htmlFor="kc-rsn">
          OSRS username (optional)
        </label>
        <div className="kc-lookup-row">
          <input
            id="kc-rsn"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Your RSN for Kill Count prices"
            maxLength={12}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={killsStatus === "loading"}
          >
            {killsStatus === "loading" ? "Checking..." : "Check my account"}
          </button>
        </div>
      </form>

      <p className="kc-lookup-hint">
        If you skip this, Kill Count, Stamina and Speed tasks are priced at full{" "}
        <strong>boss base × required kills</strong>. With your RSN, the kills you
        already have are discounted (Kill Count only) and your completed tasks
        get marked in the lists below.
      </p>

      {killsStatus === "done" && rsn && (
        <div className="kc-lookup-result">
          <span className="kc-lookup-ok">
            <strong>@{rsn}</strong>:
            {ranked.length > 0 ? (
              <>
                {" "}
                {ranked.slice(0, MAX_CHIPS).map(([boss, kills]) => (
                  <span className="kc-chip" key={boss}>
                    {boss} <b>{kills.toLocaleString()}</b>
                  </span>
                ))}
                {ranked.length > MAX_CHIPS && (
                  <span className="kc-chip">+{ranked.length - MAX_CHIPS} more</span>
                )}
              </>
            ) : (
              <span className="kc-chip">no boss kills found</span>
            )}
            {completedTaskIds.size > 0 && (
              <span className="kc-chip">
                {completedTaskIds.size} tasks completed
              </span>
            )}
          </span>
          <button
            type="button"
            className="kc-lookup-clear"
            onClick={forgetKills}
            aria-label="Forget RSN"
          >
            ✕
          </button>
        </div>
      )}

      {killsStatus === "error" && (
        <div className="kc-lookup-error">{killsError}</div>
      )}
    </div>
  );
}