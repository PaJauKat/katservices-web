"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CartEntry, CurrencyCode, ServiceItem } from "@/lib/types";
import type { GearItem } from "@/data/gear";
import { fetchLiveRates, type LiveRates } from "@/lib/exchange";

interface ShopState {
  cart: CartEntry[];
  addToCart: (item: ServiceItem) => void;
  addGearToCart: (item: GearItem, note: string | null, modKey: string, totalGP: number) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotalGP: number;

  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;

  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  liveRates: LiveRates;
  ratesLive: boolean;

  toast: (msg: React.ReactNode) => void;
  toastMsg: React.ReactNode;
}

const ShopContext = createContext<ShopState | null>(null);

const CART_KEY = "katservices_cart_v1";

function loadCart(): CartEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currency, setCurrencyState] = useState<CurrencyCode>("GP");
  const [liveRates, setLiveRates] = useState<LiveRates>({
    clpPerUsd: null,
    eurPerUsd: null,
  });
  const [toastMsg, setToastMsg] = useState<React.ReactNode>("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCart(loadCart());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* ignore quota errors */
    }
  }, [cart]);

  useEffect(() => {
    let active = true;
    fetchLiveRates().then((r) => {
      if (active) setLiveRates(r);
    });
    return () => {
      active = false;
    };
  }, []);

  const addToCart = useCallback((item: ServiceItem) => {
    setCart((prev) => {
      const existing = prev.find((e) => e.id === item.id);
      if (existing) {
        return prev.map((e) =>
          e.id === item.id ? { ...e, qty: e.qty + 1 } : e
        );
      }
      return [
        ...prev,
        { id: item.id, text: item.text, option: item.option, content: item.content, intPrice: item.intPrice, qty: 1 },
      ];
    });
    setIsCartOpen(false);
  }, []);

  const addGearToCart = useCallback(
    (item: GearItem, note: string | null, modKey: string, totalGP: number) => {
      const id = `gear-${item.slug}${modKey ? `-${modKey}` : ""}`;
      setCart((prev) => {
        const existing = prev.find((e) => e.id === id);
        if (existing) {
          return prev.map((e) => (e.id === id ? { ...e, qty: e.qty + 1 } : e));
        }
        return [
          ...prev,
          {
            id,
            text: item.name,
            option: "Gear",
            content: null,
            intPrice: totalGP,
            qty: 1,
            note,
          },
        ];
      });
      setIsCartOpen(false);
    },
    []
  );

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((e) => (e.id === id ? { ...e, qty: Math.min(99, Math.max(0, e.qty + delta)) } : e))
        .filter((e) => e.qty > 0)
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const setCurrency = useCallback((c: CurrencyCode) => setCurrencyState(c), []);

  const toast = useCallback((msg: React.ReactNode) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2600);
  }, []);

  const cartCount = useMemo(() => cart.reduce((acc, e) => acc + e.qty, 0), [cart]);
  const cartTotalGP = useMemo(
    () => cart.reduce((acc, e) => acc + e.intPrice * e.qty, 0),
    [cart]
  );
  const ratesLive = liveRates.clpPerUsd != null && liveRates.eurPerUsd != null;

  const value: ShopState = {
    cart,
    addToCart,
    addGearToCart,
    removeFromCart,
    updateQty,
    clearCart,
    cartCount,
    cartTotalGP,
    isCartOpen,
    openCart,
    closeCart,
    currency,
    setCurrency,
    liveRates,
    ratesLive,
    toast,
    toastMsg,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopState {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}
