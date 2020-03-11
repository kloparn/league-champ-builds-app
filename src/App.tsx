import React, { useState, useEffect } from 'react';
import axios from 'axios'
import HeroCard from './components/HeroCard'
import logo from './logo.svg';
import './App.css';
import { Hero, HeroWrapper } from './types';

function App() {
  const [champions, setChampions] = useState({} as HeroWrapper)
  useEffect(() => {
    async function fetchHeroes() {
      const res = await axios.get("http://ddragon.leagueoflegends.com/cdn/10.5.1/data/en_US/champion.json")
      const data = res.data
      setChampions(data.data)
      console.log(data)

    }
    fetchHeroes();
  }, [])
  return (
    <div>
      {Object.keys(champions).map(champ => <HeroCard key={champions[champ].key} name={champions[champ].id} blurb={champions[champ].blurb} />)}
      <HeroCard name="Anton" blurb="I am sadly not a character"></HeroCard>
      {JSON.stringify(champions["Aatrox"])}
    </div>
  );
}

export default App;
