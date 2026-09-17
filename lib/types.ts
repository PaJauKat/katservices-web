export interface ServiceItem {
  id: string;
  menu: string;
  option: string;
  content: string | null;
  text: string;
  description?: string | null;
  priceLabel: string;
  intPrice: number;
  /** Tipo de tarea (Kill Count, Mechanical, ...). Solo aplica a CAs. */
  type?: string | null;
  /** Kills que pide una task Kill Count (param de final_data.json). */
  kills?: number | null;
  /** True cuando el precio se calcula con base del boss x kills (hiscore). */
  dynamicPrice?: boolean;
  /** id de la task en la wiki / RuneLite sync (completadas). */
  wikiCaId?: number | null;
  /** Tasks que esta task tambien completa (misma task en un modo mas alto).
   *  Ej: "Insanity" (GM) tambien completa "Perfect Wardens" (Master). */
  alsoCompletes?: string[] | null;
}

export interface ServiceGroup {
  option: string;
  slug: string;
  items: ServiceItem[];
}

export type CurrencyCode = "GP" | "USD" | "CLP" | "EUR";

export interface CartEntry {
  id: string;
  text: string;
  option: string;
  content: string | null;
  intPrice: number;
  qty: number;
  note?: string | null;
  type?: string | null;
  kills?: number | null;
  alsoCompletes?: string[] | null;
}