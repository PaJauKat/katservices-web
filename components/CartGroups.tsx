"use client";

import Link from "next/link";
import { useShop } from "@/components/ShopProvider";
import { formatCurrency } from "@/lib/exchange";
import { countTaskLabel, groupTotalGP, isCountTask, type PricedCartEntry } from "@/lib/pricing";

interface CartGroupsProps {
  detailed?: boolean;
}

/**
 * Renderiza el carrito agrupado por boss: una sola tarjeta por grupo,
 * con filas compactas para la tarifa base (si aplica) y cada task.
 * Las tasks Kill Count muestran su precio dinamico (base x kills faltantes)
 * descontando las kills del hiscore del cliente cuando hay RSN.
 * `detailed` agranda un poco las filas para la pagina /cart.
 */
export default function CartGroups({ detailed = false }: CartGroupsProps) {
  const { cartGroups, removeFromCart, updateQty, currency, liveRates, rsn } = useShop();

  const hasUnlookedKc = cartGroups.some((g) =>
    g.tasks.some((t) => isCountTask(t) && g.baseGP > 0)
  );

  const metaOf = (g: { isGear: boolean; baseGP: number }, e: PricedCartEntry): string | null => {
    if (e.coveredBy) return `included with ${e.coveredBy}`;
    if (g.isGear) return e.note ? e.note : null;
    if (isCountTask(e)) {
      const parts = [`${countTaskLabel(e)} · ${e.kills} kills`];
      if (e.type !== "Stamina" && e.type !== "Speed" && g.baseGP > 0 && rsn) {
        parts.push(`you have ${e.ownedKills ?? 0}`);
        if ((e.killsNeeded ?? e.kills ?? 0) < (e.kills ?? 0)) {
          parts.push(`${e.killsNeeded} needed`);
        }
      }
      return parts.join(" · ");
    }
    return [e.content, e.note].filter(Boolean).join(" · ") || null;
  };

  return (
    <div className={`cart-groups-list${detailed ? " detailed" : ""}`}>
      {hasUnlookedKc && !rsn && (
        <div className="cart-rsn-tip">
          <span>💡</span>
          <span>
            Add your RSN on{" "}
            <Link href="/combat-achievements" className="cart-rsn-link">
              Combat Achievements
            </Link>{" "}
            to discount the kills you already have on Kill Count tasks.
          </span>
        </div>
      )}
      {cartGroups.map((g) => (
        <div className="cart-group" key={g.key}>
          <div className="cart-group-head">
            <span className="cart-group-title">{g.key}</span>
            <span className="cart-group-total">
              {formatCurrency(groupTotalGP(g), currency, liveRates)}
            </span>
          </div>

          {g.chargeBase && (
            <div className="cart-row cart-row-base">
              <span className="cart-row-text">Kill / run base</span>
              <span className="cart-row-price">
                {formatCurrency(g.baseGP, currency, liveRates)}
              </span>
            </div>
          )}

          {g.tasks.map((e) => {
            const meta = metaOf(g, e);
            return (
              <div className="cart-row" key={e.id}>
                <div className="cart-row-main">
                  <div className="cart-row-text">
                    {g.isGear ? e.text : `+ ${e.text}`}
                    {e.qty > 1 && <span className="cart-row-qty">×{e.qty}</span>}
                  </div>
                  {meta && <div className="cart-row-meta">{meta}</div>}
                </div>
                <div className="cart-row-right">
                  {g.isGear && (
                    <div className="qty-control qty-control-sm">
                      <button onClick={() => updateQty(e.id, -1)} aria-label="Decrease quantity">
                        −
                      </button>
                      <span>{e.qty}</span>
                      <button onClick={() => updateQty(e.id, 1)} aria-label="Increase quantity">
                        +
                      </button>
                    </div>
                  )}
                  {e.coveredBy ? (
                    <span className="cart-row-price cart-row-incl">Incl.</span>
                  ) : (
                    <span className="cart-row-price">
                      {formatCurrency(e.effGP * e.qty, currency, liveRates)}
                    </span>
                  )}
                  <button
                    className="cart-row-remove"
                    onClick={() => removeFromCart(e.id)}
                    aria-label={`Remove ${e.text}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}