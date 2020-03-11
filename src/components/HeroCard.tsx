import React from 'react'
import { Hero } from '../types'

//version, id, key, name, title, blurb, info, Image, tags, partype, stats,

const HeroCard: React.FC<Hero> = (props) => {
    return (
        <div>
            <h1>{props.name}</h1>
            <p>{props.blurb}</p>
        </div>
    )
}

export default HeroCard
