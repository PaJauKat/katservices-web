import type { GearImage } from "@/data/gear";

/**
 * LOCAL PRESENTATION - descriptions, images, requirements and reference
 * screenshots for each featured item. NOT part of kat-data (that repo only
 * holds pricing + modifiers). Merged with remote prices in lib/gear.ts.
 */
export interface GearMeta {
  slug: string;
  icon: string;
  image?: string;
  tagline: string;
  description: string;
  requirements: string[];
  references?: GearImage[];
}

export const gearMeta: Record<string, GearMeta> = {
  "infernal-cape": {
    slug: "infernal-cape",
    icon: "/images/icons/Infernal_cape.png",
    image: "/images/products/infernal-cape.png",
    tagline: "Best in slot cape for Melee",
    description:
      "Base price assumes you have the Twisted bow. Armour items are not important for the price just the weapons. It's important to have a blowpipe and a staff that can autocast Ancient Spells",
    requirements: [
      "+70 defence",
      "99 ranged",
      "+94 magic (Ice barrage) may be less with Saturated Heart",
    ],
    references: [
      {
        desc: "Max gear setup for the Inferno, It's just a reference. You can have lower gear items (check other gears) Main weapon, blowpipe and staff are the important ones",
        src: "/images/products/inferno-max-setup.png",
      },
      { desc: "Bowfa setup for the Inferno", src: "/images/products/inferno-bowfa.png" },
      { desc: "Crossbow setup for the Inferno", src: "/images/products/inferno-crossbow.png" },
    ],
  },
  "fire-cape": {
    slug: "fire-cape",
    icon: "/images/icons/Fire_cape.png",
    image: "/images/products/fire-cape.webp",
    tagline: "The infamous Cheese cape",
    description:
      "I complete all waves of the Tzhaar Fight Cave to deliver the Fire Cape to you in game.",
    requirements: [
      "40+ Prayer",
    ],
  },
  quiver: {
    slug: "quiver",
    icon: "/images/icons/dizana-quiver.png",
    image: "/images/products/dizana-quiver.png",
    tagline: "Smooth ranged-focused service",
    description:
      "I complete all waves of Fortis Colosseum to obtain the Dizana's Quiver",
    requirements: [
      "+90 Strength",
      "Healing source: Blood Fury, Saradomin Godsword, Blood barrage...",
      "Slash weapon: Scythe of Vitur, Abyssal whip...",
    ],
    references: [
      {
        desc: "Max gear setup for the Quiver, It's just a reference. You can have lower gear items (check other gears) Main weapon, blowpipe and staff are the important ones",
        src: "/images/products/quiver-max-setup.png",
      },
      { desc: "Minimal setup for the Quiver", src: "/images/products/quiver-minimal.png" },
    ],
  },
  "blood-torva": {
    slug: "blood-torva",
    icon: "/images/icons/Ancient_blood_ornament_kit.png",
    image: "/images/products/Sanguine_torva_armour_equipped_male.webp",
    tagline: "GiGa Chad Meele armour set",
    description:
      "Kills of all four Awakened DT2 bosses to obtain the Sanguine Torva armour set.",
    requirements: [
      "Twisted Bow",
      "Slash weapon: Scythe of Vitur, Abyssal whip...",
    ],
  },
  "radiant-oathplate": {
    slug: "radiant-oathplate",
    icon: "/images/icons/Purifying_sigil.webp",
    image: "/images/products/Radiant_oathplate_armour_equipped_male.webp",
    tagline: "Shiny melee armour set to match your slash weapons",
    description:
      "Completion of all five Yama contracts to obtain the Purifying Sigil, which can be used to ornate as many pieces of the Oathplate armour as you want.",
    requirements: [
      "82 Magic", 
      "Purging staff"
    ],
  },
};