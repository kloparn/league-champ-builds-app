export interface ChampionImage {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ChampionInfo {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
}

export interface ChampionStats {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
}

export interface ChampionSkin {
  id: string;
  num: number;
  name: string;
  chromas: boolean;
}

export interface ChampionSpell {
  id: string;
  name: string;
  description: string;
  tooltip: string;
  maxrank: number;
  cooldownBurn: string;
  costBurn: string;
  rangeBurn: string;
  resource: string;
  image: ChampionImage;
}

export interface ChampionPassive {
  name: string;
  description: string;
  image: ChampionImage;
}

export interface ChampionSummary {
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: ChampionInfo;
  image: ChampionImage;
  tags: string[];
  partype: string;
}

export interface ChampionDetail extends ChampionSummary {
  lore: string;
  skins: ChampionSkin[];
  spells: ChampionSpell[];
  passive: ChampionPassive;
  stats: ChampionStats;
  allytips: string[];
  enemytips: string[];
}

export interface Item {
  id: string;
  name: string;
  gold: { total: number; purchasable: boolean };
  tags: string[];
  into?: string[];
  from?: string[];
  maps?: Record<string, boolean>;
}

export interface SummonerSpell {
  id: string;
  name: string;
  description: string;
  key: string;
  image: ChampionImage;
}

export interface Rune {
  id: number;
  key: string;
  icon: string;
  name: string;
  shortDesc: string;
  longDesc: string;
}

export interface RuneSlot {
  runes: Rune[];
}

export interface RuneStyle {
  id: number;
  key: string;
  icon: string;
  name: string;
  slots: RuneSlot[];
}

/** Riot's lane identifiers from match data — keys directly into `byRole`. */
export type Lane = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY';

export const LANES: readonly { value: Lane; label: string; slug: string }[] = [
  { value: 'TOP', label: 'Top', slug: 'top' },
  { value: 'JUNGLE', label: 'Jungle', slug: 'jungle' },
  { value: 'MIDDLE', label: 'Mid', slug: 'mid' },
  { value: 'BOTTOM', label: 'Bot', slug: 'bot' },
  { value: 'UTILITY', label: 'Support', slug: 'support' }
] as const;

/** URL-friendly slugs used in query strings. Decoupled from the Riot keys so
 * `?role=support` reads naturally instead of `?role=utility`. */
export const LANE_SLUG: Record<Lane, string> = {
  TOP: 'top',
  JUNGLE: 'jungle',
  MIDDLE: 'mid',
  BOTTOM: 'bot',
  UTILITY: 'support'
};

export function laneFromSlug(slug: string | null | undefined): Lane | null {
  if (!slug) return null;
  const match = LANES.find((l) => l.slug === slug.toLowerCase());
  return match ? match.value : null;
}
