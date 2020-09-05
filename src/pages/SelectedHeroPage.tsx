import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Hero } from "../types";
import axios from "axios";
import DifficultyBar from "../components/DifficultyBar";
import DynamicStatGiver from "../components/DynamicStatGiver";
import shortid from "shortid";

const SelectedHeroPage: React.FC = () => {
  const [hero, setHero] = useState({} as Hero);
  const [skinUrls, setSkinUrls] = useState([] as string[]);
  const [currentSkin, setCurrentSkin] = useState("");
  const [version, setVersion] = useState("");

  useEffect(() => {
    const fetchVersion = async () => {
      const res = await axios.get(
        "https://ddragon.leagueoflegends.com/api/versions.json"
      );
      const data = res.data;
      setVersion(data[0]);
    };
    const getCurrentHero = async () => {
      const res = await axios.get(
        `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${
          window.location.pathname.split("/")[1]
        }.json`
      );
      const data = res.data;
      setHero(data.data[window.location.pathname.split("/")[1]]);
    };

    const getAllUrlsForSkins = () => {
      let idArr = [] as number[];
      hero.skins?.map((e) => {
        if (e.name !== "default") {
          idArr.push(e.num);
        }
      });
      if (idArr.length > 0) {
        let urls = [
          `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${
            hero.image?.full.split(".")[0]
          }_0.jpg`,
        ];
        for (let i = 0; i < idArr.length; i++) {
          urls.push(
            `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${
              hero.image?.full.split(".")[0]
            }_${idArr[i]}.jpg`
          );
        }
        setSkinUrls(urls);
        if (currentSkin === "") setCurrentSkin(urls[0]);
      }
    };
    fetchVersion();
    getCurrentHero();
    getAllUrlsForSkins();
  }, [version, hero.skins, hero.image, currentSkin]);

  const displayNextImage = () => {
    let x: number =
      skinUrls.indexOf(currentSkin) === skinUrls.length - 1
        ? 0
        : skinUrls.indexOf(currentSkin) + 1;
    setCurrentSkin(skinUrls[x]);
    console.log(currentSkin);
  };

  const displayPreviousImage = () => {
    let x: number =
      skinUrls.indexOf(currentSkin) === 0
        ? skinUrls.length - 1
        : skinUrls.indexOf(currentSkin) - 1;
    setCurrentSkin(skinUrls[x]);
    console.log(currentSkin);
  };

  return (
    <div>
      <Title>
        {hero.name} - {hero.title}
      </Title>
      <Wrapper key={hero.key}>
        {
          <HeroShowcase>
            <PreviousSkin
              onClick={displayPreviousImage}
              className="arrow left"
            ></PreviousSkin>
            <ChampPicture
              //onLoad={() => setTimeout(displayNextImage, 5000)}
              src={currentSkin}
              alt={hero.blurb}
            />
            <NextSkin
              onClick={displayNextImage}
              className="arrow right"
            ></NextSkin>
            <h4 className="text-center">{hero.lore}</h4>
            <Tags key={hero.key}>
              {hero.tags?.map((tag) => (
                <Tag key={shortid.generate()}>{tag}</Tag>
              ))}
            </Tags>
            <StatsSection>
              <ParagrahpBox>
                <br />
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
              <StatsBox>
                <Title>Stats</Title>
                {DynamicStatGiver(
                  "Health",
                  hero.stats?.hp!,
                  hero.stats?.hpperlevel!
                )}
                {DynamicStatGiver(
                  "Health Regen",
                  hero.stats?.hpregen!,
                  hero.stats?.hpregenperlevel!
                )}
                {DynamicStatGiver(
                  "Armor",
                  hero.stats?.armor!,
                  hero.stats?.armorperlevel!
                )}
                {DynamicStatGiver(
                  "Magic Resist",
                  hero.stats?.spellblock!,
                  hero.stats?.spellblockperlevel!
                )}
                <p>
                  Move. speed <strong>{hero.stats?.movespeed!}</strong>
                </p>
                {DynamicStatGiver(
                  "Attack Damage",
                  hero.stats?.attackdamage!,
                  hero.stats?.attackdamageperlevel!
                )}
              </StatsBox>
            </StatsSection>
          </HeroShowcase>
        }
      </Wrapper>
    </div>
  );
};

const Title = styled.h1`
  color: white;
  text-align: center;
`;

const StatsBox = styled.span`
  margin-top: 6rem;
  margin-right: 7rem;
  margin-bottom: 1rem;
  padding: 1rem;
  padding-top: 0;
  border: 2px solid white;
  width: 30%;
  @media (max-width: 1400px) {
    width: 100%;
    margin: 0;
    margin-bottom: 1rem;
  }
`;

const NextSkin = styled.button`
  margin: 5vh;
`;

const PreviousSkin = styled.button`
  margin: 5vh;
`;

const Tags = styled.span`
  display: flex;
  justify-content: space-evenly;
  min-width: 100%;
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

const ParagrahpBox = styled.span`
  width: 70%;
  padding: 1rem;
  @media (max-width: 1400px) {
    width: 100%;
  }
`;

const StatsSection = styled.div`
  min-width: 100%;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  @media (max-width: 1400px) {
    flex-flow: wrap;
  }
`;

const HeroShowcase = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-flow: wrap;
  @media (max-width: 1400px) {
    display: inline;
  }
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

export default SelectedHeroPage;
