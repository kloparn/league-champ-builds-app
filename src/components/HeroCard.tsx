import React from "react";
import { Hero } from "../types";
import styled from "styled-components";
import { NavLink } from "react-router-dom";

//version, id, key, name, title, blurb, info, Image, tags, partype, stats,
//<Paragraph>{props.blurb}</Paragraph>

const HeroCard: React.FC<Hero> = (props) => {
  return (
    <Card>
      <Title>{props.name === "MonkeyKing" ? "Wukong" : props.name}</Title>
      <NavLink
        to={`/${props.name}`}
        onClick={() => window.location.replace(`/${props.name}`)}
      >
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
  text-shadow: 2px 2px black;
`;

const Card = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  flex-wrap: wrap;
  margin: 3rem;
  width: 5rem;
  @media (max-width: 500px) {
    margin: 2.5rem;
  }
`;

const Image = styled.img`
  width: 10rem;
`;

export default HeroCard;
