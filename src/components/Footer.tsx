import React from "react";
import styled from "styled-components";

const Footer: React.FC = () => {
  const currentYear = () => new Date().getFullYear();
  return (
    <CustomFoot>
      <CustomP>Created by Adam Håkansson. © {currentYear()}</CustomP>
    </CustomFoot>
  );
};

const CustomP = styled.p`
  color: white;
`;

const CustomFoot = styled.footer`
  background-color: black;
  border-top: 1px solid #ccc;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  transition: all 0.25s linear;
`;

export default Footer;
