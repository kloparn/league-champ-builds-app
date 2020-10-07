export interface Hero {
  version?: string;
  id?: string;
  key?: number;
  name?: string;
  blurb?: string;
  title?: string;
  lore?: string;
  info?: {
    attack: number;
    defense: number;
    magic: number;
    difficulty: number;
  };
  image?: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
  tags?: [string];
  partype?: string;
  stats?: {
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
  };
  skins?: [
    {
      id: number;
      num: number;
      name: string;
      chromas: boolean;
    }
  ];
  spells?: [
    {
      id: string;
      name: string;
      description: string;
      tooltip: string;
      leveltip: [
        {
          label: [string];
          effect: [string];
        }
      ];
      maxrank: number;
      cooldown: [number];
      cooldownBurn: string;
      cost: [number];
      costBurn: string;
      datavalues: Object;
      effect: [[number]];
      effectBurn: [string];
      vars: [string];
      costType: string;
      maxammo: string;
      range: [number];
      rangeBurn: string;
      image: [
        {
          full: string;
          sprite: string;
          group: string;
          x: number;
          y: number;
          w: number;
          h: number;
        }
      ];
      resource: string;
    }
  ];
}

export interface HeroWrapper {
  [name: string]: Hero;
}

export interface HeroStats {
  spells?: [
    {
      id?: string;
      name?: string;
      description?: string;
      tooltip?: string;
      leveltip?: [
        {
          label: [string];
          effect: [string];
        }
      ];
      maxrank?: number;
      cooldown?: [number];
      cooldownBurn?: string;
      cost?: [number];
      costBurn?: string;
      datavalues?: Object;
      effect?: [[number]];
      effectBurn?: [string];
      vars?: [string];
      costType?: string;
      maxammo?: string;
      range?: [number];
      rangeBurn?: string;
      image?: [
        {
          full: string;
          sprite: string;
          group: string;
          x: number;
          y: number;
          w: number;
          h: number;
        }
      ];
      resource?: string;
    }
  ];
  version: string;
}
