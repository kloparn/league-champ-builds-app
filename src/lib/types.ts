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

export type ChampionRole = 'Fighter' | 'Tank' | 'Support' | 'Mage' | 'Assassin' | 'Marksman';

export const CHAMPION_ROLES: readonly ChampionRole[] = [
  'Fighter',
  'Tank',
  'Support',
  'Mage',
  'Assassin',
  'Marksman'
] as const;
