import React from "react";
import { HeroStats } from "../types/index";
import styled from "styled-components";

const AbilityContainer: React.FC<HeroStats> = (props) => {
  const { spells, version, passive } = props;

  const spellUrl = `http://ddragon.leagueoflegends.com/cdn/${version}/img/spell/`;
  const passiveUrl = `http://ddragon.leagueoflegends.com/cdn/${version}/img/passive/`;

  return (
    <SpellSection>
      <PassiveHeaderContainer>
        <SpellHeaderContainer>
          <AbilityImage src={`${passiveUrl}${passive?.image.full}`} />
          <FillParagrahp>{passive?.name}</FillParagrahp>
        </SpellHeaderContainer>
        <FillParagrahp
          dangerouslySetInnerHTML={{ __html: passive?.description! }}
        />
      </PassiveHeaderContainer>
      <SpellContainer>
        {spells?.map((spell) => (
          <SpellWrapper key={spell.id}>
            <SpellHeaderContainer>
              <AbilityImage
                src={`${spellUrl}${spell.image?.full}`}
                alt={spell.name}
              ></AbilityImage>
              <FillParagrahp>{spell.name}</FillParagrahp>
            </SpellHeaderContainer>
            <FillParagrahp
              dangerouslySetInnerHTML={{ __html: spell.description! }}
            ></FillParagrahp>
          </SpellWrapper>
        ))}
      </SpellContainer>
    </SpellSection>
  );
};

const PassiveHeaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50%;
`;

const FillParagrahp = styled.p`
  color: white;
`;

const AbilityImage = styled.img`
  width: 5rem;
  height: 5rem;
  margin: 1rem;
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
  flex-direction: row;
  min-width: 25vh;
  max-width: 70vh;
`;

const SpellContainer = styled.div`
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  flex-flow: wrap;
`;

const SpellSection = styled.section`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 1rem;
  width: 100%;
  border: 2px solid black;
  background-color: black;
  opacity: 0.7;
  color: white;
  text-shadow: none;
`;

export default AbilityContainer;
