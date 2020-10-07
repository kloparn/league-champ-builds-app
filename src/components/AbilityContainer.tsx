import React from "react";
import { HeroStats } from "../types/index";
import styled from "styled-components";

const AbilityContainer: React.FC<HeroStats> = (props) => {
  const { spells, version } = props;

  const spellUrl = `http://ddragon.leagueoflegends.com/cdn/${version}/img/spell/`;

  return (
    <SpellContainer>
      {spells?.map((spell) => (
        <SpellWrapper key={spell.id}>
          <SpellHeaderContainer>
            <AbilityImage
              src={`${spellUrl}${spell.image?.full}`}
              alt={spell.name}
            ></AbilityImage>
            <p>{spell.name}</p>
          </SpellHeaderContainer>
          <p dangerouslySetInnerHTML={{ __html: spell.description! }}></p>
          <p> hello</p>
        </SpellWrapper>
      ))}
    </SpellContainer>
  );
};

const AbilityImage = styled.img`
  width: 5rem;
  height: 5rem;
`;

const SpellHeaderContainer = styled.section`
  margin: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SpellWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  max-width: 25vh;
`;

const SpellContainer = styled.div`
  font-size: 1rem;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  width: 100%;
  border: 2px solid black;
  background-color: grey;
  color: black;
  text-shadow: none;
  flex-flow: wrap;
`;

export default AbilityContainer;
