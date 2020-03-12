import React from 'react'
import { Hero } from '../types'
import styled from 'styled-components'

//version, id, key, name, title, blurb, info, Image, tags, partype, stats,
//<Paragraph>{props.blurb}</Paragraph>
//<Title>{props.name}</Title>

const HeroCard: React.FC<Hero> = (props) => {
    return (
        <Card>
            <a href={`https://na.leagueoflegends.com/en-us/champions/${props.name?.toLocaleLowerCase()}`}><Image src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${props.name}_0.jpg`}></Image></a>
            {console.log(props)}
        </Card>
    )
}

const Title = styled.h1`
    color: white;
`

const Paragraph = styled.p`
    width: 12rem;
    margin: 2rem;
    color: white;
`

const Card = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    margin: 3rem;
    width: 5rem;
`

const Image = styled.img`
    width: 10rem;
`;

export default HeroCard
