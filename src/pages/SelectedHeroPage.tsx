import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { HeroWrapper } from "../types";
import axios from "axios";

const SelectedHeroPage: React.FC = () => {
  const [hero, setHero] = useState({} as HeroWrapper);

  useEffect(() => {
    const getCurrentHero = async () => {
      const res = await axios.get(
        `https://ddragon.leagueoflegends.com/cdn/10.13.1/data/en_US/champion/${
          window.location.pathname.split("/")[1]
        }.json`
      );
      const data = res.data;
      setHero(data.data);
    };

    getCurrentHero();
  }, []);

  return (
    <Wrapper>
      {Object.keys(hero).map((name) => (
        <HeroShowcase key={hero[name].key}>
          <img
            src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${
              hero[name].image?.full.split(".")[0]
            }_0.jpg`}
            alt={hero[name].blurb}
          />
          {hero[name].name}
        </HeroShowcase>
      ))}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  color: white;
`;
const HeroShowcase = styled.section`
  animation: fadeIn ease 5s;
  -webkit-animation: fadeIn ease 5s;
  -moz-animation: fadeIn ease 5s;
  -o-animation: fadeIn ease 5s;
  -ms-animation: fadeIn ease 5s;
  @keyframes fadeIn {
  0% {
    opacity:0;
  }
  100% {
    opacity:1;
  }
}

@-moz-keyframes fadeIn {
  0% {
    opacity:0;
  }
  100% {
    opacity:1;
  }
}

@-webkit-keyframes fadeIn {
  0% {
    opacity:0;
  }
  100% {
    opacity:1;
  }
}

@-o-keyframes fadeIn {
  0% {
    opacity:0;
  }
  100% {
    opacity:1;
  }
}

@-ms-keyframes fadeIn {
  0% {
    opacity:0;
  }
  100% {
    opacity:1;
}
`;

export default SelectedHeroPage;
