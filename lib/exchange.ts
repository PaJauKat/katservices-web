import type { CurrencyCode } from "@/lib/types";

/**
 * Exchange configuration.
 * Prices in the catalog are stored in OSRS GP (integer amounts).
 *
 * `perMillion` is how many units of each currency a single 1M GP is worth.
 * These are editable fallbacks; the live values are fetched from the
 * kat-data repo (exchange_rate file) and override them once loaded.
 */
export const EXCHANGE = {
  perMillion: {
    USD: 0.18,
    CLP: 170,
    EUR: 0.15,
  } as Record<Exclude<CurrencyCode, "GP">, number>,
};

/** @see https://github.com/PaJauKat/kat-data/blob/main/exchange_rate */
const RATE_URL = "https://raw.githubusercontent.com/PaJauKat/kat-data/main/exchange_rate";

export interface LiveRates {
  usdPerMillion: number | null;
  clpPerMillion: number | null;
  eurPerMillion: number | null;
}

function parseRateFile(raw: string): LiveRates {
  const out: LiveRates = { usdPerMillion: null, clpPerMillion: null, eurPerMillion: null };
  for (const line of raw.split(/\r?\n/)) {
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = Number(line.slice(idx + 1).trim().replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) continue;
    if (key === "usd") out.usdPerMillion = value;
    else if (key === "clp") out.clpPerMillion = value;
    else if (key === "eur") out.eurPerMillion = value;
  }
  return out;
}

export async function fetchLiveRates(): Promise<LiveRates> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${RATE_URL}?t=${Date.now()}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error("bad rate response");
    return parseRateFile(await res.text());
  } catch {
    return { usdPerMillion: null, clpPerMillion: null, eurPerMillion: null };
  }
}

const LIVE_KEY = {
  USD: "usdPerMillion",
  CLP: "clpPerMillion",
  EUR: "eurPerMillion",
} as const;

export function gpToCurrency(gp: number, currency: CurrencyCode, live?: LiveRates): number {
  if (currency === "GP") return gp;
  const gpInMillions = gp / 1_000_000;
  const liveValue = live?.[LIVE_KEY[currency]] ?? null;
  if (liveValue != null) return gpInMillions * liveValue;
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
