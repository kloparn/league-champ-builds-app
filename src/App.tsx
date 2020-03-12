import React, { useState, useEffect } from 'react';
import axios from 'axios'
import HeroCard from './components/HeroCard'
import logo from './logo.svg';
import './App.css';
import { HeroWrapper } from './types';
import styled, { ThemeProvider } from "styled-components";
import { theme } from "./styles/default-theme";
function App() {
  const [champions, setChampions] = useState({} as HeroWrapper)
  useEffect(() => {
    async function fetchHeroes() {
      const res = await axios.get("https://ddragon.leagueoflegends.com/cdn/10.5.1/data/en_US/champion.json")
      const data = res.data
      setChampions(data.data)
    }
    fetchHeroes();
  }, [])
  return (
    <ThemeProvider theme={theme}><HeroCardCollection>
      {Object.keys(champions).map(champ => <HeroCard key={champions[champ].key} name={champions[champ].id} blurb={champions[champ].blurb} image={champions[champ].image} />)}
    </HeroCardCollection>
    </ThemeProvider>
  );
}

const HeroCardCollection = styled.section`
  display: flex;
  flex-wrap: wrap;
`

export default App;
