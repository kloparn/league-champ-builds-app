import React from "react";
import { HeroStats } from "../types/index";
import styled from "styled-components";

const AbilityContainer = (stats: HeroStats, version: string) => {
  const { spells } = stats;

  console.log(version);

  const filterString = (str: string, replace: string, replaceWith: string) => {
    console.log(str);
    str.includes(replace) &&
      filterString(str.replace(replace, replaceWith), replace, replaceWith);
    return str;
  };

  return (
    <SpellContainer>
      {spells?.map((spell) => (
        <SpellWrapper key={spell.id}>
          <p>{spell.name}</p>
          <p>{filterString(spell.description!, "<br>", "")}</p>
        </SpellWrapper>
      ))}
    </SpellContainer>
  );
};

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
