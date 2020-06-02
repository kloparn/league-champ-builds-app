import React from "react";
import { Hero } from "../types";
import styled from "styled-components";

//version, id, key, name, title, blurb, info, Image, tags, partype, stats,
//<Paragraph>{props.blurb}</Paragraph>

const HeroCard: React.FC<Hero> = (props) => {
  return (
    <Card>
      <Title>{props.name}</Title>
      <a
        href={`https://na.leagueoflegends.com/en-us/champions/${props.name?.toLocaleLowerCase()}`}
      >
        <Image
          src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${props.name}_0.jpg`}
        ></Image>
      </a>
    </Card>
  );
};

const Title = styled.h1`
  color: white;
  font-family: Georgia, "Times New Roman", Times, serif;
`;

const Card = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin: 3rem;
  width: 5rem;
`;

const Image = styled.img`
  width: 10rem;
`;

export default HeroCard;
