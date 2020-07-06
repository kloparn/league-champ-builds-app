import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Hero } from "../types";
import axios from "axios";
import DifficultyBar from "../components/DifficultyBar";
import shortid from "shortid";

const SelectedHeroPage: React.FC = () => {
  const [hero, setHero] = useState({} as Hero);
  const [skinAmount, setSkinAmount] = useState(0);
  const [skinUrls, setSkinUrls] = useState([]);

  useEffect(() => {
    const getCurrentHero = async () => {
      const res = await axios.get(
        `https://ddragon.leagueoflegends.com/cdn/10.13.1/data/en_US/champion/${
          window.location.pathname.split("/")[1]
        }.json`
      );
      const data = res.data;
      setHero(data.data[window.location.pathname.split("/")[1]]);
    };

    const updateNumberOfSkins = () => {
      let counter = 0;
      hero.skins?.map((e) => {
        if (e.name !== "default") {
          counter++;
        }
      });
      setSkinAmount(counter);
    };

    getCurrentHero();
    updateNumberOfSkins();
  }, [hero.skins]);

  return (
    <div>
      <Title>
        {hero.name} - {hero.title}
      </Title>
      <Wrapper key={hero.key}>
        {
          <HeroShowcase>
            <ChampPicture
              src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${
                hero.image?.full.split(".")[0]
              }_0.jpg`}
              alt={hero.blurb}
            />
            <ParagrahpBox>
              <Tags key={hero.key}>
                {hero.tags?.map((tag) => (
                  <Tag key={shortid.generate()}>{tag}</Tag>
                ))}
              </Tags>

              <ParagrahpBox>
                <p>{hero.lore}</p>
              </ParagrahpBox>
              <br />
              <h2>Stats</h2>
              <h3>
                Attack power
                <DifficultyBar
                  difficulty={
                    hero.info?.attack !== undefined ? hero.info?.attack : 0
                  }
                />
              </h3>
              <h3>
                Defense power
                <DifficultyBar
                  difficulty={
                    hero.info?.defense !== undefined ? hero.info?.defense : 0
                  }
                />
              </h3>
              <h3>
                Magic power
                <DifficultyBar
                  difficulty={
                    hero.info?.magic !== undefined ? hero.info?.magic : 0
                  }
                />
              </h3>
              <h3>
                Difficulty
                <DifficultyBar
                  difficulty={
                    hero.info?.difficulty !== undefined
                      ? hero.info?.difficulty
                      : 0
                  }
                />
              </h3>
            </ParagrahpBox>
          </HeroShowcase>
        }
      </Wrapper>
      <TempSkinIdentifier>{skinAmount}</TempSkinIdentifier>
    </div>
  );
};

const Title = styled.h1`
  color: white;
  text-align: center;
`;

const Tags = styled.span`
  display: flex;
  justify-content: space-evenly;
`;

const TempSkinIdentifier = styled.p`
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  color: white;
`;

const Tag = styled.p`
  padding: 1rem;
  background-color: white;
  border-radius: 25px;
  color: black;
`;

const Wrapper = styled.div`
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 1rem;
  padding-right: 1rem;
`;

const ChampPicture = styled.img`
  width: 100%;
  height: 100%;
  max-width: 120vh;
  object-fit: contain;
  animation: fadeIn ease 3s;
  -webkit-animation: fadeIn ease 3s;
  -moz-animation: fadeIn ease 3s;
  -o-animation: fadeIn ease 3s;
  -ms-animation: fadeIn ease 3s;
  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  @-moz-keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  @-webkit-keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  @-o-keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  @-ms-keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
`;

const ParagrahpBox = styled.span`
  padding: 1rem;
`;

const HeroShowcase = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  @media (max-width: 1400px) {
    display: inline;
  }
`;

export default SelectedHeroPage;
