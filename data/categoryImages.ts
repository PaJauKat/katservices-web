/**
 * Images for Combat Achievement categories (= the `monster` field of
 * combat_achivements.json in kat-data). Files live in public/images/products.
 * Categories without an entry fall back to a category emoji.
 */
export const categoryImages: Record<string, string> = {
  "General Graardor": "/images/products/General_Graardor.webp",
  "Commander Zilyana": "/images/products/Commander_Zilyana.webp",
  "K'ril Tsutsaroth": "/images/products/800px-K'ril_Tsutsaroth.webp",
  "Kree'arra": "/images/products/280px-Kree'arra.webp",
  "Duke Sucellus": "/images/products/800px-Duke_Sucellus.png",
  Leviathan: "/images/products/800px-The_Leviathan.webp",
  Vardorvis: "/images/products/Vardorvis.webp",
  Whisperer: "/images/products/The_Whisperer.png",
  "The Nightmare": "/images/products/fire-cape.webp",
};

/** Nicer icon per tier, used as a fallback + section marker. */
export const tierEmoji: Record<string, string> = {
  Easy: "🟢",
  Medium: "🟡",
  Hard: "🟠",
  Elite: "🔴",
  Master: "🟣",
  Grandmaster: "🟣",
};