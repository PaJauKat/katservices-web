import bossesRaw from "@/data/bosses-prices.json";
import type { CartEntry } from "@/lib/types";

/**
 * Pricing con solapamiento de tasks por kill/run.
 *
 * Tasks "count" (type="Kill Count" o "Stamina" con parametro `kills` de
 * final_data.json):
 *   precio = base_del_boss x kill_faltantes
 * donde kill_faltantes = kills que pide la task - kills ya cubiertos
 * (hiscore del cliente + tareas de mayor requisito del mismo boss, para no
 * contar kills dos veces, ej. Adept 25 + Veteran 50 = 50 kills totales).
 * Las tasks Stamina ("N kills en una misma sesion") NO descuentan hiscore,
 * pero si se solapan entre tasks del mismo boss.
 *
 * Si el boss no tiene base en bosses-prices.json, la task mantiene su precio
 * estatico. La linea "Kill / run base" se absorbe cuando el grupo tiene
 * count tasks (su precio ya cubre todos los kills).
 */

export interface PricedCartEntry extends CartEntry {
  /** Precio efectivo por unidad tras el pricing dinamico. */
  effGP: number;
  /** Kills que faltan por cubrir de esta task (null si no es KC con base). */
  killsNeeded: number | null;
  /** Kills que ya posee el cliente en ese boss segun hiscores (null si no aplica). */
  ownedKills: number | null;
  /** Nombre de la task (GM) que ya cubre esta en el carrito (jerarquia). */
  coveredBy: string | null;
}

export interface CartGroup {
  key: string;
  isGear: boolean;
  /** Tarifa base del boss en GP. 0 si el boss no esta en bosses-prices.json. */
  baseGP: number;
  /** Si el grupo cobra la linea "Kill / run base" (false con Kill Count tasks). */
  chargeBase: boolean;
  tasks: PricedCartEntry[];
  tasksTotalGP: number;
}

export interface CartBreakdown {
  groups: CartGroup[];
  totalGP: number;
}

/** kills por boss obtenidos de los OSRS hiscores del cliente. */
export type KillCounts = Record<string, number>;

const bosses = bossesRaw as Record<string, number | null>;

export function getBossBaseGP(monster: string): number {
  const m = bosses[monster];
  return typeof m === "number" ? Math.round(m * 1_000_000) : 0;
}

export function isKillCountTask(t: CartEntry | PricedCartEntry): boolean {
  return t.type === "Kill Count" && t.kills != null && t.kills > 0;
}

export function isStaminaTask(t: CartEntry | PricedCartEntry): boolean {
  return t.type === "Stamina" && t.kills != null && t.kills > 0;
}

export function isSpeedTask(t: CartEntry | PricedCartEntry): boolean {
  return t.type === "Speed" && t.kills != null && t.kills > 0;
}

/**
 * Tipo "count" con precio base del boss x kills: Kill Count (con descuento
 * de hiscore), Stamina y Speed con kills (kills en una sesion/trip o con
 * limite de tiempo, sin descuento de hiscore).
 */
export function isCountTask(t: CartEntry | PricedCartEntry): boolean {
  return isKillCountTask(t) || isStaminaTask(t) || isSpeedTask(t);
}

/** Etiqueta corta del tipo count para chips y metas. */
export function countTaskLabel(t: { type?: string | null }): string {
  if (t.type === "Stamina") return "Stamina";
  if (t.type === "Speed") return "Speed";
  return "Kill Count";
}

/**
 * Precio dinamico de UNA task count (Kill Count / Stamina / Speed) fuera del
 * carrito: base del boss x kills de la task. Para Kill Count se descuentan
 * las kills que ya posee el cliente; Stamina y Speed no usan hiscore.
 * Devuelve null si no aplica (sin base en bosses-prices.json -> precio estatico).
 */
export function countTaskPrice(
  monster: string,
  type: string | null | undefined,
  kills: number | null | undefined,
  ownedKills: number | null | undefined
): number | null {
  if (!isCountTask({ type, kills } as CartEntry)) return null;
  const base = getBossBaseGP(monster);
  if (base <= 0) return null;
  const owned = type === "Kill Count" ? Math.max(0, ownedKills ?? 0) : 0;
  return base * Math.max(0, (kills ?? 0) - owned);
}

export function groupTotalGP(g: CartGroup): number {
  return (g.chargeBase ? g.baseGP : 0) + g.tasksTotalGP;
}

export function computeCartBreakdown(
  cart: CartEntry[],
  killCounts?: KillCounts
): CartBreakdown {
  const counts = killCounts ?? {};
  const groups: CartGroup[] = [];
  const index = new Map<string, CartGroup>();

  for (const entry of cart) {
    const isGear = entry.id.startsWith("gear-") || entry.option === "Gear";
    const key = isGear ? "Gear" : entry.option || "Other";

    let group = index.get(key);
    if (!group) {
      group = {
        key,
        isGear,
        baseGP: isGear ? 0 : getBossBaseGP(key),
        chargeBase: !isGear,
        tasks: [],
        tasksTotalGP: 0,
      };
      index.set(key, group);
      groups.push(group);
    }
    group.tasks.push({
      ...entry,
      effGP: entry.intPrice,
      killsNeeded: null,
      ownedKills: null,
      coveredBy: null,
    });
  }

  for (const group of groups) {
    const countTasks = group.tasks
      .filter(isCountTask)
      .sort((a, b) => (a.kills ?? 0) - (b.kills ?? 0));

    if (countTasks.length > 0) {
      // La linea base queda absorbida: el precio de las count tasks ya cubre los kills.
      group.chargeBase = false;
      const base = group.baseGP;
      const owned = Math.max(0, counts[group.key] ?? 0);
      // Las kills del hiscore descuentan solo tasks Kill Count; las Stamina
      // ("N kills en una sesion") no se descuentan pero si se solapan entre tasks.
      let covered = 0;
      let ownedApplied = false;
      for (const task of countTasks) {
        const isKc = isKillCountTask(task);
        if (isKc && !ownedApplied) covered = Math.max(covered, owned);
        ownedApplied = ownedApplied || isKc;
        const needed = Math.max(0, (task.kills ?? 0) - covered);
        task.killsNeeded = needed;
        task.ownedKills = isKc ? owned : null;
        task.effGP = base > 0 ? base * needed : task.intPrice;
        covered = Math.max(covered, task.kills ?? 0);
      }
    }

    for (const task of group.tasks) {
      if (!isCountTask(task)) task.effGP = task.intPrice;
    }
    group.tasksTotalGP = group.tasks.reduce(
      (acc, t) => acc + t.effGP * t.qty,
      0
    );
  }

  // Cobertura por jerarquia "also_completes": una task de modo mas alto
  // (ej. "Insanity" GM) completa las tasks mas bajas de la misma boss
  // (ej. "Perfect Wardens" Master) en la misma corrida. Si ambas estan en el
  // carrito, la corrida se hace en el modo mas alto y se cobra solo esa.
  const byName = new Map<string, PricedCartEntry>();
  for (const g of groups) {
    for (const t of g.tasks) byName.set(t.text, t);
  }
  for (const g of groups) {
    for (const task of g.tasks) {
      const also = task.alsoCompletes ?? [];
      if (also.length === 0) continue;
      for (const name of also) {
        const covered = byName.get(name);
        if (covered && covered.coveredBy == null) {
          covered.coveredBy = task.text;
          covered.effGP = 0;
        }
      }
    }
  }
  // Si TODAS las tasks de un grupo estan cubiertas por tasks de otro grupo,
  // el servicio se ejecuta en el modo del grupo que cubre: no se cobra la
  // base del grupo cubierto (ej. ToB normal cubierto por ToB Expert Mode).
  for (const g of groups) {
    if (g.tasks.length > 0 && g.tasks.every((t) => t.coveredBy != null)) {
      g.chargeBase = false;
    }
  }
  for (const g of groups) {
    g.tasksTotalGP = g.tasks.reduce((acc, t) => acc + t.effGP * t.qty, 0);
  }

  const totalGP = groups.reduce((acc, g) => acc + groupTotalGP(g), 0);
  return { groups, totalGP };
}