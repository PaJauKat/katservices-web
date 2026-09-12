export interface GearModOption {
  id: string;
  label: string;
  addGP: number;
}

export interface GearModGroup {
  id: string;
  label?: string;
  options: GearModOption[];
}

export type GearModification = GearModOption | GearModGroup;

export interface GearImage {
  desc: string;
  src: string;
}

export interface GearItem {
  slug: string;
  name: string;
  icon: string;
  /** Product icon: the item render or boss image from public/images/products */
  image?: string;
  /** Reference screenshots of gear setups, shown in a gallery under the modifiers */
  references?: GearImage[];
  tagline: string;
  description: string;
  basePriceGP: number;
  requirements: string[];
  modifications: GearModification[];
}