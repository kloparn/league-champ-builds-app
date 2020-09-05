import React from "react";

const DynamicStatGiver = (stat: string, base: number, increment: number) => {
  const maxLevelValue = (base: number, increment: number) => {
    return increment * 17 + base;
  };

  return (
    <p>
      {stat} <strong>{base}</strong> ({increment} * lvl) {"->"} ({base} -
      {maxLevelValue(base, increment).toFixed(2).split(".")[1] === "00"
        ? maxLevelValue(base, increment)
        : maxLevelValue(base, increment).toFixed(2)}
      )
    </p>
  );
};

export default DynamicStatGiver;
