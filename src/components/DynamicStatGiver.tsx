import React from "react";
import styled from "styled-components";

const DynamicStatGiver = (stat: string, base: number, increment: number) => {
  const maxLevelValue = (base: number, increment: number) => {
    return increment * 17 + base;
  };

  return (
    <StatRow>
      {stat}: <strong>{base}</strong> ({increment} * lvl) {"->"} ({base} -
      {maxLevelValue(base, increment).toFixed(2).split(".")[1] === "00"
        ? maxLevelValue(base, increment)
        : maxLevelValue(base, increment).toFixed(2)}
      )
    </StatRow>
  );
};

const StatRow = styled.p`
  border: 2px solid white;
`;

export default DynamicStatGiver;
