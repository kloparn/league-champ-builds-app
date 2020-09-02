import React, { useState, useEffect } from "react";
import { HeroWrapper } from "../types";
import styled from "styled-components";
import HeroCard from "../components/HeroCard";
import axios from "axios";

const HeroCollectionPage = () => {
  const [champions, setChampions] = useState({} as HeroWrapper);
  const [filter, setFilter] = useState("");
  const [version, setVersion] = useState("");

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

  return (
    <div className="searchbar">
      <SearchLabel htmlFor="search">Search for a champion</SearchLabel>
      <SearchInput
        type="text"
        onChange={(e) => {
          setFilter(e.target.value.toLowerCase());
        }}
      />
      <HeroCardCollection>
        {Object.keys(champions)
          .filter((c) => c.toLowerCase().includes(filter))
          .map((champ) => (
            <HeroCard
              key={champions[champ].key}
              name={champions[champ].id}
              blurb={champions[champ].blurb}
              image={champions[champ].image}
            />
          ))}
      </HeroCardCollection>
      ;
    </div>
  );
};

const HeroCardCollection = styled.section`
  display: flex;
  flex-wrap: wrap;
`;

const SearchLabel = styled.label`
  font-size: 32px;
  padding: 20px;
  color: white;
`;
const SearchInput = styled.input`
  color: purple;
  background-color: green;
  font-size: 32px;
`;

export default HeroCollectionPage;
