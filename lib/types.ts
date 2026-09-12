export interface ServiceItem {
  id: string;
  menu: string;
  option: string;
  content: string | null;
  text: string;
  description?: string | null;
  priceLabel: string;
  intPrice: number;
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
}
