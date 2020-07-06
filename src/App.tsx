import React, { useState, useEffect } from "react";
import {
  HeroCollectionPage as HeroPage,
  SelectedHeroPage as SelectedPage,
} from "./pages";
import "./App.css";
import styled, { ThemeProvider } from "styled-components";
import { BrowserRouter as Router, Route } from "react-router-dom";

import { theme } from "./styles/default-theme";
function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Route exact path="/" component={HeroPage} />
        <Route
          exact
          path={`${window.location.pathname}`}
          component={SelectedPage}
        />
      </Router>
    </ThemeProvider>
  );
}

export default App;
