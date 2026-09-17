"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useShop } from "@/components/ShopProvider";
import CartGroups from "@/components/CartGroups";
import CheckoutForm from "@/components/CheckoutForm";
import CurrencySelector from "@/components/CurrencySelector";
import { formatCurrency } from "@/lib/exchange";

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    closeCart,
    cartTotalGP,
    currency,
    liveRates,
    ratesLive,
  } = useShop();

  const [doneOrderId, setDoneOrderId] = useState("");

  useEffect(() => {
    if (cart.length > 0) setDoneOrderId("");
  }, [cart.length]);

  const emptyTitle = doneOrderId
    ? "Order submitted!"
    : "Your cart is empty.";
  const emptyText = doneOrderId
    ? "We will contact you on Discord shortly to arrange payment in game."
    : "Browse the services and add a few tasks to build your order.";

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
              <p>{emptyTitle}</p>
              <small className="text">{emptyText}</small>
              {doneOrderId && <small className="text">{`Order #${doneOrderId}`}</small>}
            </div>
          ) : (
            <CartGroups />
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="currency-selector-wrap">
              <CurrencySelector />
              {currency !== "GP" && (
                <p className="rates-hint">
                  {ratesLive ? "Live FX rate via exchange-api." : "Approximate conversion (offline rates)."}{" "}
                  GP display: {formatCurrency(cartTotalGP, "GP")}
                </p>
              )}
            </div>

            <div className="cart-total">
              <span className="cart-total-label">Total</span>
              <span className="cart-total-value">
                {formatCurrency(cartTotalGP, currency, liveRates)}
              </span>
            </div>

            <Link href="/cart" className="cart-detail-link" onClick={closeCart}>
              <span>View full cart details</span>
              <span aria-hidden="true">→</span>
            </Link>

            <CheckoutForm
              key={isCartOpen ? "open" : "closed"}
              onOrderDone={(id) => setDoneOrderId(id)}
            />
          </div>
        )}
      </aside>
    </>
  );
}