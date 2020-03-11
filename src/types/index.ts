export interface Hero {
    version?: string,
    id?: string,
    key?: number,
    name?: string,
    blurb?: string,
    info?: {
        attack: number,
        defence: number,
        magic: number,
        difficulty: number
    },
    imagine?: {
        full: string,
        sprite: string,
        group: string,
        x: number,
        y: number,
        w: number,
        h: number
    },
    tags?: [string],
    partype?: string,
    stats?: {
        hp: number,
        hpperlevel: number,
        mp: number,
        mpperlevel: number,
        movespeed: number,
        armor: number,
        armorperlevel: number,
        spellblock: number,
        spellblockperlevel: number,
        attackrange: number,
        hpregen: number,
        hpregenperlevel: number,
        mpregen: number,
        mpregenperlevel: number,
        crit: number,
        critperlevel: number,
        attackdamage: number,
        attackdamageperlevel: number,
        attackspeedperlevel: number,
        attackspeed: number
    }
}

export interface HeroWrapper {
    [name: string]: Hero
}
