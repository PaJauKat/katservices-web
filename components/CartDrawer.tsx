"use client";

import { useEffect, useState } from "react";
import { useShop } from "@/components/ShopProvider";
import DiscordButton from "@/components/DiscordButton";
import { formatCurrency } from "@/lib/exchange";
import { STORE, discordProfileUrl } from "@/lib/config";
import type { CurrencyCode } from "@/lib/types";

const CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: "GP", label: "OSRS GP" },
  { code: "USD", label: "USD" },
  { code: "CLP", label: "CLP" },
  { code: "EUR", label: "EUR" },
];

interface OrderResponse {
  ok: boolean;
  error?: string;
  orderId?: string;
}

export default function CartDrawer() {
  const {
    cart,
    removeFromCart,
    updateQty,
    clearCart,
    cartTotalGP,
    isCartOpen,
    closeCart,
    currency,
    setCurrency,
    liveRates,
    ratesLive,
  } = useShop();

  const [rsn, setRsn] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    if (isCartOpen) setStatus("idle");
  }, [isCartOpen]);

  const submitOrder = async () => {
    setStatus("loading");
    setStatusMsg("");
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rsn: rsn.trim(), currency, items: cart }),
      });
      const data = (await res.json()) as OrderResponse;
      if (data.ok) {
        setStatus("done");
        setOrderId(data.orderId ?? "");
        setStatusMsg("Order sent! We will message you on Discord to arrange payment in game.");
        clearCart();
      } else {
        setStatus("error");
        setStatusMsg(
          data.error ??
            "Could not send the order automatically. Please copy your cart and message us on Discord."
        );
      }
    } catch {
      setStatus("error");
      setStatusMsg("Network error. Please copy your cart and message us on Discord.");
    }
  };

  const copySummary = async () => {
    const lines = cart.map((e) => {
      const meta = [e.option, e.content, e.note].filter(Boolean).join(" / ");
      return `- ${e.text} [${meta}] x${e.qty}`;
    });
    const text = [
      "KatServices order request:",
      ...lines,
      `Total: ${formatCurrency(cartTotalGP, currency, liveRates)}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      {isCartOpen && <div className="cart-backdrop" onClick={closeCart} />}
      <aside className={`cart-drawer${isCartOpen ? " open" : ""}`} aria-hidden={!isCartOpen}>
        <div className="cart-header">
          <h3>Your Cart</h3>
          <button className="cart-close" onClick={closeCart} aria-label="Close cart">
            ✕
          </button>
        </div>

        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">🛒</div>
              <p>
                {status === "done"
                  ? "Order submitted. We will contact you on Discord shortly."
                  : "Your cart is empty. Browse the services and add a few."}
              </p>
              {status === "done" && orderId && (
                <small className="text">{`Order #${orderId}`}</small>
              )}
            </div>
          ) : (
            <>
              {cart.map((e) => (
                <div className="cart-item" key={e.id}>
                  <div className="cart-item-top">
                    <div>
                      <div className="cart-item-text">{e.text}</div>
                      <div className="cart-item-sub">
                        {e.option}
                        {e.content ? ` · ${e.content}` : ""}
                        {e.note ? ` · ${e.note}` : ""}
                      </div>
                    </div>
                    <div className="cart-item-price">
                      {formatCurrency(e.intPrice * e.qty, currency, liveRates)}
                    </div>
                  </div>
                  <div className="cart-item-bottom">
                    <div className="qty-control">
                      <button onClick={() => updateQty(e.id, -1)} aria-label="Decrease quantity">
                        −
                      </button>
                      <span>{e.qty}</span>
                      <button onClick={() => updateQty(e.id, 1)} aria-label="Increase quantity">
                        +
                      </button>
                    </div>
                    <button className="remove-btn" onClick={() => removeFromCart(e.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
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

            {currency !== "GP" && ratesLive && (
              <p className="rates-hint">
                Live FX rate via exchange-api. GP display:{" "}
                {formatCurrency(cartTotalGP, "GP")}
              </p>
            )}
            {currency !== "GP" && !ratesLive && (
              <p className="rates-hint">
                Approximate conversion (offline rates). GP display:{" "}
                {formatCurrency(cartTotalGP, "GP")}
              </p>
            )}

            <div className="cart-total">
              <span className="cart-total-label">Total</span>
              <span className="cart-total-value">
                {formatCurrency(cartTotalGP, currency, liveRates)}
              </span>
            </div>

            <div className="checkout-card">
              <h4 className="checkout-title">Request this order</h4>
              <p className="rates-hint" style={{ marginBottom: 12 }}>
                Payment is arranged in game in OSRS GP. We will contact you over Discord.
              </p>
              <div className="form-field">
                <label className="field-label" htmlFor="rsn">
                  Your RSN (optional)
                </label>
                <input
                  id="rsn"
                  className="text-input"
                  placeholder="RuneScape name"
                  value={rsn}
                  maxLength={12}
                  onChange={(e) => setRsn(e.target.value)}
                />
              </div>

              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={submitOrder}
                disabled={status === "loading"}
              >
                {status === "loading" ? "Sending..." : "Send order to Discord"}
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: "100%" }}
                onClick={copySummary}
              >
                Copy summary
              </button>

              {status !== "idle" && (
                <div className={`order-status ${status === "done" ? "success" : "error"}`}>
                  {statusMsg}
                </div>
              )}
              {status === "error" && (
                <div style={{ marginTop: 10, width: "100%" }}>
                  <DiscordButton
                    className="btn btn-discord"
                    label={
                      discordProfileUrl
                        ? "Open Discord"
                        : `Copy @${STORE.discord.username} to contact`
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
