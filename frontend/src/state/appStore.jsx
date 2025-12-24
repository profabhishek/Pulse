import {
  createContext,
  useContext,
  useState,
  useEffect
} from "react";

import {
  connectMQTT,
  subscribeTextChannel
} from "../services/mqttService";

/**
 * Global App Context
 */
const AppContext = createContext(null);

/**
 * Provider
 */
export function AppProvider({ children }) {
  // -----------------------------
  // Current channel (text / voice)
  // -----------------------------
  const [currentChannel, setCurrentChannel] = useState({
    id: "general",
    type: "TEXT"
  });

  // -----------------------------
  // Messages per channel
  // -----------------------------
  const [messages, setMessages] = useState({
    general: [],
    random: [],
    gaming: []
  });

  // -----------------------------
  // Voice state (future use)
  // -----------------------------
  const [voice, setVoice] = useState({
    connected: false,
    channel: null,
    users: []
  });

  // -----------------------------
  // Connect to MQTT ONCE
  // -----------------------------
  useEffect(() => {
    connectMQTT((topic, message) => {
      // topic example:
      // pulse/dev/inder/text/general
      const channelId = topic.split("/").pop();

      setMessages(prev => ({
        ...prev,
        [channelId]: [...(prev[channelId] || []), message]
      }));
    });
  }, []);

  // -----------------------------
  // Subscribe when channel changes
  // -----------------------------
  useEffect(() => {
    subscribeTextChannel(currentChannel.id);
  }, [currentChannel.id]);

  // -----------------------------
  // Provide state
  // -----------------------------
  return (
    <AppContext.Provider
      value={{
        currentChannel,
        setCurrentChannel,
        messages,
        setMessages,
        voice,
        setVoice
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook to use app state
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside AppProvider");
  }
  return context;
}
