import React from "react";

interface bar {
  difficulty: number;
}

const DifficultyBar = (props: bar) => {
  const { difficulty } = props;

  const containerStyles = {
    height: 20,
    width: "80%",
    backgroundColor: "#e0e0de",
    borderRadius: 50,
    margin: 20,
  };

  const fillerStyles = {
    height: "100%",
    width: `${difficulty * 10}%`,
    backgroundColor: "green",
  };

  const labelStyles = {
    color: "white",
  };
  return (
    <div style={containerStyles}>
      <div style={fillerStyles}>
        <span style={labelStyles}></span>
      </div>
    </div>
  );
};

export default DifficultyBar;
