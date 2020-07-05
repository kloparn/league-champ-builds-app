import React from "react";
import { Hero } from "../types";
import styled from "styled-components";
import { NavLink } from "react-router-dom";

//version, id, key, name, title, blurb, info, Image, tags, partype, stats,
//<Paragraph>{props.blurb}</Paragraph>

const HeroCard: React.FC<Hero> = (props) => {
  return (
    <Card>
      <Title>{props.name}</Title>
      <NavLink to={`/${props.name}`}>
        <Image
          src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${props.name}_0.jpg`}
        ></Image>
      </NavLink>
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
