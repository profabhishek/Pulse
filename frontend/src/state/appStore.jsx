import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef
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

  const [channels] = useState([
    { id: "general", name: "general", type: "TEXT" },
    { id: "random", name: "random", type: "TEXT" },
    { id: "gaming", name: "Gaming", type: "VOICE" } // 👈 VOICE channel
  ]);

  const [currentChannel, setCurrentChannel] = useState({
    id: "general",
    type: "TEXT"
  });

  const currentChannelRef = useRef(currentChannel.id);
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
    random: 0,
    gaming: 0
  });


  // -----------------------------
  // Voice state (future use)
  // -----------------------------
  const [voice, setVoice] = useState({
    connected: false,
    channel: null,
    users: []
  });

  useEffect(() => {
    currentChannelRef.current = currentChannel.id;
  }, [currentChannel.id]);


  // -----------------------------
  // Connect to MQTT ONCE
  // -----------------------------
  useEffect(() => {
    connectMQTT((topic, message) => {
      const channelId = topic.split("/").pop();

      setMessages(prev => ({
        ...prev,
        [channelId]: [...(prev[channelId] || []), message]
      }));

      setUnread(prev => {
        if (channelId === currentChannelRef.current) return prev;

        return {
          ...prev,
          [channelId]: Math.min((prev[channelId] || 0) + 1, 99)
        };
      });
    });
  }, []);


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
        channels,
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
