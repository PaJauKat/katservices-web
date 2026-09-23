"use client";

import { useShop } from "@/components/ShopProvider";
import { STORE } from "@/lib/config";
import { formatIntPrice } from "@/lib/services";
import { countTaskLabel, countTaskPrice } from "@/lib/pricing";
import type { ServiceItem } from "@/lib/types";

export default function ServiceRow({ item }: { item: ServiceItem }) {
  const { addToCart, toast, completedTaskIds, rsn, killCounts, cart } = useShop();
  const completed = item.wikiCaId != null && completedTaskIds.has(item.wikiCaId);
  const inCart = cart.some((e) => e.id === item.id);

  // Precio dinamico de una task count (Kill Count / Stamina) con las kills
  // del hiscore del cliente (solo descuenta en Kill Count).
  const discounted = item.dynamicPrice
    ? countTaskPrice(item.option, item.type, item.kills, rsn ? killCounts[item.option] : null)
    : null;
  const isStamina = item.type === "Stamina" || item.type === "Speed";
  const ownKills = rsn && item.dynamicPrice && !isStamina
    ? (killCounts[item.option] ?? 0)
    : null;
  const hiscoreDone = discounted != null && discounted <= 0 && ownKills != null;
  const done = completed || hiscoreDone;

  const handleAdd = () => {
    const added = addToCart(item);
    toast(
      added ? (
        <>
          Added to cart: <span className="accent">{item.text}</span>
        </>
      ) : (
        <>
          Already in cart: <span className="accent">{item.text}</span>
        </>
      )
    );
  };

  return (
    <div className={`service-row${done ? " done" : ""}${inCart ? " in-cart" : ""}`}>
      <div className="service-info">
        <div className="service-text">
          {item.text}
          {done && <span className="done-badge">✓ Completed</span>}
          {inCart && !done && <span className="in-cart-badge">✓ In cart</span>}
          {item.dynamicPrice && item.kills ? (
            <span className="kc-chip kc-chip-row">
              {`${countTaskLabel(item)} · ${item.kills} kills${ownKills != null ? ` · have ${ownKills}` : ""}`}
            </span>
          ) : null}
        </div>
        <div className="service-option">
          {item.description ? item.description : item.option}
        </div>
      </div>
      <div className="service-right">
        <div className="service-price">
          {discounted != null && discounted < item.intPrice ? (
            <>
              <span className="price-old">{item.priceLabel}</span>
              {discounted > 0 && (
                <span className="price-now">{formatIntPrice(discounted)} GP</span>
              )}
            </>
          ) : (
            <>{item.priceLabel} GP</>
          )}
        </div>
        <button
          className={`add-btn${inCart ? " added" : ""}`}
          onClick={handleAdd}
          disabled={done || inCart}
        >
          {done ? "✓ Done" : inCart ? "✓ Added" : "+ Add"}
        </button>
      </div>
    </div>
  );
}