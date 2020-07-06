import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Hero } from "../types";
import axios from "axios";

const SelectedHeroPage: React.FC<Hero> = () => {
  const [hero, setHero] = useState({} as Hero);

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
  console.log(hero.name);

  return <Wrapper id={hero.id}>Currently selected {hero.name}</Wrapper>;
};

const Wrapper = styled.div`
  color: white;
`;

export default SelectedHeroPage;
