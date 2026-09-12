"use client";

import { useShop } from "@/components/ShopProvider";
import { STORE } from "@/lib/config";
import type { ServiceItem } from "@/lib/types";

export default function ServiceRow({ item }: { item: ServiceItem }) {
  const { addToCart, toast } = useShop();

  const handleAdd = () => {
    addToCart(item);
    toast(
      <>
        Added to cart: <span className="accent">{item.text}</span>
      </>
    );
  };

  return (
    <div className="service-row">
      <div className="service-info">
        <div className="service-text">{item.text}</div>
        <div className="service-option">
          {item.option}
          {item.content ? ` · ${item.content}` : ""}
        </div>
      </div>
      <div className="service-right">
        <div className="service-price">{item.priceLabel} GP</div>
        <button className="add-btn" onClick={handleAdd}>
          + Add
        </button>
      </div>
    </div>
  );
}
