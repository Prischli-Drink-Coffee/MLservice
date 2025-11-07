import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import App from "./App";
import theme from "./theme";
import { AuthProvider } from "./context/AuthContext";
import "./xy-theme.css";
import "@xyflow/react/dist/style.css";
import "./styles/reactflow-custom.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <ChakraProvider theme={theme}>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <AuthProvider>
      <App />
    </AuthProvider>
  </ChakraProvider>,
);
