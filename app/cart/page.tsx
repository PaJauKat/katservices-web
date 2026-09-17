"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useShop } from "@/components/ShopProvider";
import CartGroups from "@/components/CartGroups";
import CheckoutForm from "@/components/CheckoutForm";
import CurrencySelector from "@/components/CurrencySelector";
import { formatCurrency } from "@/lib/exchange";
import { groupTotalGP } from "@/lib/pricing";

export default function CartPage() {
  const { cart, cartGroups, cartCount, cartTotalGP, currency, liveRates, ratesLive } =
    useShop();

  const [doneOrderId, setDoneOrderId] = useState("");

  useEffect(() => {
    if (cart.length > 0) setDoneOrderId("");
  }, [cart.length]);

  if (doneOrderId) {
    return (
      <>
        <Link href="/" className="back-link">
          <span>←</span> Back to store
        </Link>
        <div className="cart-page-done">
          <div className="cart-empty-icon">🛒</div>
          <h1 className="section-title">Order submitted!</h1>
          <p className="cart-page-done-text">
            We will contact you on Discord shortly to arrange payment in game.
          </p>
          {doneOrderId && <small className="text">{`Order #${doneOrderId}`}</small>}
          <Link href="/" className="btn btn-primary">
            <span>Back to store</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </>
    );
  }

  if (cart.length === 0) {
    return (
      <>
        <Link href="/" className="back-link">
          <span>←</span> Back to store
        </Link>
        <div className="cart-page-empty">
          <div className="cart-empty-icon">🛒</div>
          <h1 className="section-title">Your cart is empty</h1>
          <p className="cart-page-done-text">
            Browse the services and add the tasks you want, or use the CA Tier
            calculator to build your order.
          </p>
          <Link href="/combat-achievements" className="btn btn-primary">
            <span>Browse services</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Link href="/" className="back-link">
        <span>←</span> Back to store
      </Link>

      <div className="section-header">
        <div className="header-badge">YOUR ORDER</div>
        <h1 className="section-title">
          Cart <span className="highlight-red">details</span>
        </h1>
        <p className="section-sub">
          {cartCount} {cartCount === 1 ? "item" : "items"} across{" "}
          {cartGroups.length} {cartGroups.length === 1 ? "boss" : "bosses"}. Review the
          breakdown below before sending your order.
        </p>
      </div>

      <div className="cart-page-grid">
        <div className="cart-page-items">
          <CartGroups detailed />
        </div>

        <div className="cart-page-side">
          <div className="cart-page-side-card">
            <h3 className="cart-page-side-title">Display currency</h3>
            <CurrencySelector />
            {currency !== "GP" && (
              <p className="rates-hint">
                {ratesLive
                  ? "Live FX rate via exchange-api."
                  : "Approximate conversion (offline rates)."}{" "}
                GP display: {formatCurrency(cartTotalGP, "GP")}
              </p>
            )}
          </div>

          <div className="cart-page-side-card">
            <h3 className="cart-page-side-title">Summary</h3>
            <div className="summary-list">
              {cartGroups.map((g) => (
                <div className="summary-row" key={g.key}>
                  <span>{g.isGear ? "Gear" : g.key}</span>
                  <b>{formatCurrency(groupTotalGP(g), currency, liveRates)}</b>
                </div>
              ))}
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span className="gold">{formatCurrency(cartTotalGP, currency, liveRates)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="cart-page-checkout">
        <CheckoutForm onOrderDone={(id) => setDoneOrderId(id)} />
      </div>
    </>
  );
}