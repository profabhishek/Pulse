import { Buffer } from "buffer";
window.global = window;
window.process = { env: {} };
window.Buffer = Buffer;

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider } from "./state/appStore";
import "./styles/pulse.css";
import { connectMQTT } from "./services/mqttService";

connectMQTT((topic, msg) => {
  try {
    if (topic.includes("/voice/presence/")) {
      window.dispatchEvent(
        new CustomEvent("voice-presence", { detail: msg })
      );
    } else if (topic.includes("/voice/signaling/")) {
      window.dispatchEvent(
        new CustomEvent("voice-signal", { detail: msg })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent("mqtt:message", { detail: { topic, msg } })
      );
    }
  } catch (e) {
    console.error("mqtt dispatch failed", e);
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <AppProvider>
    <App />
  </AppProvider>
);
