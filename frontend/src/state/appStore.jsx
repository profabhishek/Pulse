import {
  createContext,
  useContext,
  useState,
  useEffect
} from "react";

import {
  connectMQTT
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
    random: []
  });

  // -----------------------------
  // 🔥 Unread counts per channel
  // -----------------------------
  const [unread, setUnread] = useState({
    general: 0,
    random: 0
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
      // topic: pulse/dev/text/general
      const channelId = topic.split("/").pop();

      // append message
      setMessages(prev => ({
        ...prev,
        [channelId]: [...(prev[channelId] || []), message]
      }));

      // 🔥 increment unread if not active
      setUnread(prev => {
        if (channelId === currentChannel.id) return prev;

        const current = prev[channelId] || 0;
        return {
          ...prev,
          [channelId]: Math.min(current + 1, 10)
        };
      });
    });
  }, [currentChannel.id]);

  // -----------------------------
  // Clear unread when channel opens
  // -----------------------------
  useEffect(() => {
    if (currentChannel.type === "TEXT") {
      setUnread(prev => ({
        ...prev,
        [currentChannel.id]: 0
      }));
    }
  }, [currentChannel.id, currentChannel.type]);

  // -----------------------------
  // Provide state
  // -----------------------------
  return (
    <AppContext.Provider
      value={{
        currentChannel,
        setCurrentChannel,
        messages,
        unread,
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
