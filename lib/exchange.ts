import type { CurrencyCode } from "@/lib/types";

/**
 * Exchange configuration.
 * Prices in the catalog are stored in OSRS GP (integer amounts).
 *
 * `perMillion` is how many units of each currency a single 1M GP is worth.
 * These are editable defaults; when live FX rates can be fetched, the app
 * will override CLP/EUR based on the USD value.
 */
export const EXCHANGE = {
  perMillion: {
    USD: 0.04,
    CLP: 41.0,
    EUR: 0.034,
  } as Record<Exclude<CurrencyCode, "GP">, number>,
};

/** @see https://github.com/fawazahmed0/exchange-api */
const FX_API = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json";

export interface LiveRates {
  clpPerUsd: number | null;
  eurPerUsd: number | null;
}

export async function fetchLiveRates(): Promise<LiveRates> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(FX_API, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timer);
    if (!res.ok) throw new Error("bad fx response");
    const data = (await res.json()) as { usd?: { clp?: number; eur?: number } };
    return {
      clpPerUsd: typeof data.usd?.clp === "number" ? data.usd.clp : null,
      eurPerUsd: typeof data.usd?.eur === "number" ? data.usd.eur : null,
    };
  } catch {
    return { clpPerUsd: null, eurPerUsd: null };
  }
}

export function gpToCurrency(gp: number, currency: CurrencyCode, live?: LiveRates): number {
  const gpInMillions = gp / 1_000_000;

  if (currency === "GP") {
    return gp;
  }

  if (currency === "USD") {
    return gpInMillions * EXCHANGE.perMillion.USD;
  }

  const rateKey = currency === "CLP" ? "clpPerUsd" : "eurPerUsd";
  if (live?.[rateKey] != null) {
    const usdValue = gpInMillions * EXCHANGE.perMillion.USD;
    return usdValue * (live[rateKey] as number);
  }

  return gpInMillions * EXCHANGE.perMillion[currency];
}

const fmt = (n: number, digitsMax: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: digitsMax });

export function formatCurrency(gp: number, currency: CurrencyCode, live?: LiveRates): string {
  const value = gpToCurrency(gp, currency, live);
  switch (currency) {
    case "GP":
      return `${fmt(gp / 1_000_000, 1)}M gp`;
    case "USD":
      return `$${fmt(value, 2)}`;
    case "CLP":
      return `CLP ${fmt(value, 0)}`;
    case "EUR":
      return `€${fmt(value, 2)}`;
  }
}
