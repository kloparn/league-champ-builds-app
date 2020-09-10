import React, { useState, useEffect } from "react";
import { HeroWrapper } from "../types";
import styled from "styled-components";
import HeroCard from "../components/HeroCard";
import axios from "axios";

const HeroCollectionPage = () => {
  const [champions, setChampions] = useState({} as HeroWrapper);
  const [filter, setFilter] = useState("");
  const [version, setVersion] = useState("");
  const [tag, setTag] = useState("");

  useEffect(() => {
    const fetchVersion = async () => {
      const res = await axios.get(
        "https://ddragon.leagueoflegends.com/api/versions.json"
      );
      const data = res.data;
      setVersion(data[0]);
    };
    const fetchHeroes = async () => {
      const res = await axios.get(
        `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`
      );
      const data = res.data;
      setChampions(data.data);
    };
    fetchVersion();
    fetchHeroes();
  }, [version]);

  const contains = (tags: [string], pickedTag: string) => {
    let tempExists: boolean = false;

    // eslint-disable-next-line array-callback-return
    tags.map((tag) => {
      tag === pickedTag
        ? (tempExists = true)
        : tempExists === true
        ? (tempExists = true)
        : (tempExists = false);
    });
    return tempExists;
  };

  return (
    <Collection className="searchbar">
      <SearchWrapper>
        <SearchLabel htmlFor="search">Search for a champion</SearchLabel>
        <SearchInput
          type="text"
          onChange={(e) => {
            setFilter(e.target.value.toLowerCase());
          }}
        />
        <TagSearch
          name="role"
          onChange={(e) => {
            setTag(e.target.value);
          }}
        >
          <option value="None">All</option>
          <option value="Fighter">Fighter</option>
          <option value="Tank">Tank</option>
          <option value="Support">Support</option>
          <option value="Mage">Mage</option>
          <option value="Assassin">Assassin</option>
          <option value="Marksman">Marksman</option>
        </TagSearch>
      </SearchWrapper>
      <Filler></Filler>
      <HeroCardCollection>
        {Object.keys(champions)
          .filter((c) => c.toLowerCase().includes(filter))
          .map((champ) =>
            tag === "" || tag === "None" ? (
              <HeroCard
                key={champions[champ].key}
                name={champions[champ].id}
                blurb={champions[champ].blurb}
                image={champions[champ].image}
              />
            ) : contains(champions[champ].tags!, tag) ? (
              <HeroCard
                key={champions[champ].key}
                name={champions[champ].id}
                blurb={champions[champ].blurb}
                image={champions[champ].image}
              />
            ) : null
          )}
      </HeroCardCollection>
      ;
    </Collection>
  );
};

const Filler = styled.div`
  min-height: 5vh;
  @media (max-width: 950px) {
    min-height: 0vh;
  }
`;

const Collection = styled.div`
  background-image: url("league-background.png");
  background-size: cover;
  background-attachment: fixed;
`;

const SearchWrapper = styled.div`
  position: fixed;
  left: 30%;
  text-shadow: 2px 2px black;
  background-color: lightblue;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  @media (max-width: 950px) {
    left: 0 !important;
    position: relative;
  }
  @media (max-width: 1300px) {
    left: 20%;
  }
  @media (max-width: 1030px) {
    left: 15%;
  }
`;

const HeroCardCollection = styled.section`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  min-height: 86.9vh;
`;

const TagSearch = styled.select`
  text-align: center;
  font-size: 32px;
  margin: 5px;
  z-index: 1;
`;

const SearchLabel = styled.label`
  font-size: 32px;
  padding: 20px;
  color: black;
  text-shadow: 2px 2px white;
  z-index: 1;
`;
const SearchInput = styled.input`
  color: black;
  width: 15rem;
  background-color: white;
  font-size: 32px;
  height: 20%;
`;

export default HeroCollectionPage;
