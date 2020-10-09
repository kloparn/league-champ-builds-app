import React from "react";
import { HeroStats } from "../types/index";
import styled from "styled-components";

const AbilityContainer: React.FC<HeroStats> = (props) => {
  const { spells, version, passive, partype } = props;

  const spellUrl = `http://ddragon.leagueoflegends.com/cdn/${version}/img/spell/`;
  const passiveUrl = `http://ddragon.leagueoflegends.com/cdn/${version}/img/passive/`;

  return (
    <SpellSection>
      <PassiveHeaderContainer>
        <SpellHeaderContainer>
          <WhiteBorder>
            <PassiveInfo>Passive</PassiveInfo>
          </WhiteBorder>
          <AbilityImage src={`${passiveUrl}${passive?.image.full}`} />
          <FillParagrahp>{passive?.name}</FillParagrahp>
        </SpellHeaderContainer>
        <FillParagrahp
          dangerouslySetInnerHTML={{ __html: passive?.description! }}
        />
      </PassiveHeaderContainer>
      <SpellContainer>
        {spells?.map((spell) => (
          <div key={spell.id}>
            <SpellWrapper>
              <SpellHeaderContainer>
                <AbilityImage
                  src={`${spellUrl}${spell.image?.full}`}
                  alt={spell.name}
                ></AbilityImage>
                <FillParagrahp>{spell.name}</FillParagrahp>
                <WhiteLineRight />
              </SpellHeaderContainer>
              <SpellInfo>
                <FillParagrahp
                  dangerouslySetInnerHTML={{ __html: spell.description! }}
                ></FillParagrahp>
                <FillParagrahp
                  dangerouslySetInnerHTML={{ __html: spell.tooltip! }}
                ></FillParagrahp>
              </SpellInfo>
            </SpellWrapper>
            <Container>
              <p>
                CD: <strong> [{spell.cooldownBurn!}]</strong>
              </p>
              <p>
                <strong>[{spell.costBurn}]</strong> {partype}{" "}
              </p>
            </Container>
            <WhiteLineBottom />
          </div>
        ))}
      </SpellContainer>
    </SpellSection>
  );
};

const SpellInfo = styled.div``;

const WhiteLineRight = styled.div`
  border-right: 2px solid white;
`;

const WhiteLineBottom = styled.div`
  border-bottom: 2px solid white;
`;

const Container = styled.div`
  display: flex;
  font-size: 1.1rem;
  justify-content: space-evenly;
  align-items: center;
  flex-flow: wrap;
`;

const WhiteBorder = styled.div`
  border: 2px solid white;
  min-height: 100%;
  width: 5rem;
  height: 5rem;
  text-align: center;
  align-items: center;
  justify-content: center;
  display: flex;
`;

const PassiveInfo = styled.h1``;

const PassiveHeaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 70%;
  @media (max-width: 900px) {
    flex-flow: wrap;
  }
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
  justify-content: space-between;
  align-items: center;
`;

const SpellWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
  min-width: 25vh;
  max-width: 70vh;

  @media (max-width: 900px) {
    justify-content: center;
    flex-flow: wrap;
    text-align: center;
  }
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
