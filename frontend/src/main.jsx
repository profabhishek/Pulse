import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider } from "./state/appStore";
import "./styles/pulse.css"; // 🔥 THIS IS REQUIRED

ReactDOM.createRoot(document.getElementById("root")).render(
  <AppProvider>
    <App />
  </AppProvider>
);
