"use client";

import { useShop } from "@/components/ShopProvider";
import type { CurrencyCode } from "@/lib/types";

const CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: "GP", label: "OSRS GP" },
  { code: "USD", label: "USD" },
  { code: "CLP", label: "CLP" },
  { code: "EUR", label: "EUR" },
];

export default function CurrencySelector() {
  const { currency, setCurrency } = useShop();

  return (
    <div className="currency-selector" role="group" aria-label="Display currency">
      {CURRENCIES.map((c) => (
        <button
          key={c.code}
          className={`currency-chip${currency === c.code ? " active" : ""}`}
          onClick={() => setCurrency(c.code)}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}