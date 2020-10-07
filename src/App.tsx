import React from "react";
import {
  HeroCollectionPage as HeroPage,
  SelectedHeroPage as SelectedPage,
} from "./pages";
import { Footer } from "./components";
import "./App.css";
import styled, { ThemeProvider } from "styled-components";
import { BrowserRouter as Router, Route } from "react-router-dom";

import { theme } from "./styles/default-theme";
function App() {
  return (
    <ThemeProvider theme={theme}>
      <Screen>
        <Router>
          <Route exact path="/" component={HeroPage} />
          <Route
            exact
            path={
              window.location.pathname !== "/"
                ? `${window.location.pathname}`
                : "/will-not-load"
            }
            component={SelectedPage}
          />
        </Router>
        <Footer />
      </Screen>
    </ThemeProvider>
  );
}

const Screen = styled.div``;

export default App;
