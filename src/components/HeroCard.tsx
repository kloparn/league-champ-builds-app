import React from 'react'
import { Hero } from '../types'
import styled from 'styled-components'

//version, id, key, name, title, blurb, info, Image, tags, partype, stats,

const HeroCard: React.FC<Hero> = (props) => {
    return (
        <Card>
            <h1>{props.name}</h1>
            <Paragraph>{props.blurb}</Paragraph>
            <Image src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${props.name}_0.jpg`}></Image>
        </Card>
    )
}

const Paragraph = styled.p`
    width: 12rem;
    margin: 2rem;
`
const Card = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    margin: 3rem;
    width: 53rem;
`

const Image = styled.img`
    border: 20px solid black;
    width: 20rem;
    margin: 2rem;
`;

export default HeroCard
