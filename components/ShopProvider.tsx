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
import { computeCartBreakdown, type CartGroup, type KillCounts } from "@/lib/pricing";

export type KillsStatus = "idle" | "loading" | "done" | "error";

interface ShopState {
  cart: CartEntry[];
  cartGroups: CartGroup[];
  addToCart: (item: ServiceItem) => boolean;
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

  /** RSN del cliente (para descontar kills de suscores en tasks Kill Count). */
  rsn: string;
  killCounts: KillCounts;
  /** wiki_ca_id de las tasks que el cliente ya tiene completadas (RuneLite sync). */
  completedTaskIds: Set<number>;
  killsStatus: KillsStatus;
  killsError: string;
  lookupPlayer: (rsn: string) => Promise<{ ok: boolean; error?: string }>;
  forgetKills: () => void;

  toast: (msg: React.ReactNode) => void;
  toastMsg: React.ReactNode;
}

const ShopContext = createContext<ShopState | null>(null);

const CART_KEY = "katservices_cart_v1";
const RSN_KEY = "katservices_rsn_v1";

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

function loadRsn(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(RSN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currency, setCurrencyState] = useState<CurrencyCode>("GP");
  const [liveRates, setLiveRates] = useState<LiveRates>({
    usdPerMillion: null,
    clpPerMillion: null,
    eurPerMillion: null,
  });
  const [toastMsg, setToastMsg] = useState<React.ReactNode>("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [rsn, setRsnState] = useState("");
  const [killCounts, setKillCounts] = useState<KillCounts>({});
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<number>>(new Set());
  const [killsStatus, setKillsStatus] = useState<KillsStatus>("idle");
  const [killsError, setKillsError] = useState("");

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
    try {
      window.localStorage.setItem(RSN_KEY, rsn);
    } catch {
      /* ignore */
    }
  }, [rsn]);

  const lookupPlayer = useCallback(
    async (rsnInput: string): Promise<{ ok: boolean; error?: string }> => {
      const value = rsnInput.trim();
      if (!value) {
        return { ok: false, error: "Enter your RSN first." };
      }
      setRsnState(value);
      setKillsStatus("loading");
      setKillsError("");

      const [killsRes, syncRes] = await Promise.all([
        fetch(`/api/hiscores?${new URLSearchParams({ user: value }).toString()}`),
        fetch(`/api/ca-tier?${new URLSearchParams({ username: value }).toString()}`),
      ]);

      let killsErrorMsg: string | null = null;
      let syncErrorMsg: string | null = null;
      let gotKills = false;
      let gotSync = false;

      if (killsRes.ok) {
        const data = (await killsRes.json()) as { kills?: KillCounts };
        setKillCounts(data.kills ?? {});
        gotKills = true;
      } else {
        const data = (await killsRes.json().catch(() => ({}))) as { error?: string };
        killsErrorMsg = data.error ?? `Hiscore lookup failed (${killsRes.status}).`;
      }

      if (syncRes.ok) {
        const data = (await syncRes.json()) as { combat_achievements?: number[] };
        setCompletedTaskIds(new Set(data.combat_achievements ?? []));
        gotSync = true;
      } else {
        const data = (await syncRes.json().catch(() => ({}))) as { error?: string };
        syncErrorMsg = data.error ?? `Progress lookup failed (${syncRes.status}).`;
      }

      if (!gotKills && !gotSync) {
        setKillCounts({});
        setCompletedTaskIds(new Set());
        setKillsStatus("error");
        const message = [killsErrorMsg, syncErrorMsg].filter(Boolean).join(" ");
        setKillsError(message);
        return { ok: false, error: message };
      }

      setKillsStatus("done");
      return { ok: true };
    },
    []
  );

  // Si ya hay un RSN guardado, reconsulta sus datos al volver a la web.
  useEffect(() => {
    const saved = loadRsn();
    if (saved) {
      void lookupPlayer(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const forgetKills = useCallback(() => {
    setRsnState("");
    setKillCounts({});
    setCompletedTaskIds(new Set());
    setKillsStatus("idle");
    setKillsError("");
  }, []);

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
    let added = true;
    setCart((prev) => {
      const existing = prev.find((e) => e.id === item.id);
      if (existing) {
        added = false;
        return prev;
      }
      return [
        ...prev,
        {
          id: item.id,
          text: item.text,
          option: item.option,
          content: item.content,
          intPrice: item.intPrice,
          qty: 1,
          type: item.type,
          kills: item.kills,
          alsoCompletes: item.alsoCompletes,
        },
      ];
    });
    setIsCartOpen(false);
    return added;
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
            type: "Gear",
            kills: null,
            alsoCompletes: null,
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
  const breakdown = useMemo(() => computeCartBreakdown(cart, killCounts), [cart, killCounts]);
  const cartGroups = breakdown.groups;
  const cartTotalGP = breakdown.totalGP;
  const ratesLive =
    liveRates.usdPerMillion != null &&
    liveRates.clpPerMillion != null &&
    liveRates.eurPerMillion != null;

  const value: ShopState = {
    cart,
    cartGroups,
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
    rsn,
    killCounts,
    completedTaskIds,
    killsStatus,
    killsError,
    lookupPlayer,
    forgetKills,
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