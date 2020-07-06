import React, { useState, useEffect } from "react";
import styled from "styled-components";

const SelectedHeroPage = () => {
  return (
    <Wrapper>
      Currently selected {`${window.location.pathname.split("/")[1]}`}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  color: white;
`;

export default SelectedHeroPage;
