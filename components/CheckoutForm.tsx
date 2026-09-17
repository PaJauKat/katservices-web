"use client";

import { useState } from "react";
import { useShop } from "@/components/ShopProvider";
import DiscordButton from "@/components/DiscordButton";
import { formatCurrency } from "@/lib/exchange";
import { STORE, discordProfileUrl } from "@/lib/config";

interface OrderResponse {
  ok: boolean;
  error?: string;
  orderId?: string;
}

interface CheckoutFormProps {
  /** Se llama tras enviar el pedido con exito (se firma con el orderId). */
  onOrderDone?: (orderId: string) => void;
}

export default function CheckoutForm({ onOrderDone }: CheckoutFormProps) {
  const { cart, cartGroups, clearCart, cartTotalGP, currency, liveRates } = useShop();

  const [discord, setDiscord] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [orderId, setOrderId] = useState("");

  const submitOrder = async () => {
    setStatus("loading");
    setStatusMsg("");
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discord: discord.trim(), currency, items: cart }),
      });
      const data = (await res.json()) as OrderResponse;
      if (data.ok) {
        setStatus("done");
        setOrderId(data.orderId ?? "");
        setStatusMsg("Order sent! We will message you on Discord to arrange payment in game.");
        clearCart();
        onOrderDone?.(data.orderId ?? "");
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
    const lines: string[] = [];
    for (const g of cartGroups) {
      if (g.chargeBase && !g.isGear) {
        lines.push(`- Kill base [${g.key}]: ${formatCurrency(g.baseGP, "GP")}`);
      }
      for (const e of g.tasks) {
        const meta = g.isGear
          ? [e.option, e.content, e.note].filter(Boolean).join(" / ")
          : [e.content, e.note].filter(Boolean).join(" / ");
        const parts = meta ? ` [${meta}]` : "";
        const incl = e.coveredBy ? " [incl. with " + e.coveredBy + "]" : "";
        lines.push(
          `- ${e.text}${parts}${incl} x${e.qty} — ${formatCurrency(e.effGP * e.qty, "GP")}`
        );
      }
    }
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
    <div className="checkout-card">
      <h4 className="checkout-title">Request this order</h4>
      <p className="rates-hint" style={{ marginBottom: 12 }}>
        Payment is arranged in game in OSRS GP. Add your Discord username so we can
        contact you directly.
      </p>
      <div className="form-field">
        <label className="field-label" htmlFor="discord">
          Discord username (optional)
        </label>
        <input
          id="discord"
          className="text-input"
          placeholder="pajau"
          value={discord}
          maxLength={32}
          onChange={(e) => setDiscord(e.target.value)}
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
      <button className="btn btn-secondary" style={{ width: "100%" }} onClick={copySummary}>
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
  );
}