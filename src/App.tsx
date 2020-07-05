import React, { useState, useEffect } from "react";
import { HeroCollectionPage as HeroPage } from "./pages";
import "./App.css";
import styled, { ThemeProvider } from "styled-components";

import { theme } from "./styles/default-theme";
function App() {
  return (
    <ThemeProvider theme={theme}>
      <HeroPage />
    </ThemeProvider>
  );
}

export default App;
