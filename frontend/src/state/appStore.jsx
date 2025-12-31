import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo
} from "react";

import { connectMQTT } from "../services/mqttService";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [channels] = useState([
    { id: "general", name: "general", type: "TEXT" },
    { id: "random", name: "random", type: "TEXT" },
    { id: "gaming", name: "Gaming", type: "VOICE" }
  ]);

  const [currentChannel, setCurrentChannel] = useState({
    id: "general",
    type: "TEXT"
  });

  const currentChannelRef = useRef(currentChannel.id);

  const [messages, setMessages] = useState({
    general: [],
    random: []
  });

  const [unread, setUnread] = useState({
    general: 0,
    random: 0,
    gaming: 0
  });

  const [voice, setVoice] = useState({
    connected: false,
    channel: null,
    users: []
  });

  useEffect(() => {
    currentChannelRef.current = currentChannel.id;
  }, [currentChannel.id]);

  const channelTypeMap = useMemo(() => {
    const m = {};
    channels.forEach((c) => {
      if (c && c.id) m[c.id] = c.type;
    });
    return m;
  }, [channels]);

  useEffect(() => {
    setMessages((prev) => ({ ...prev, ...(messages || {}) }));

  }, []);

  useEffect(() => {
    const unsub = connectMQTT((topic, rawMessage) => {
      const channelId = String(topic || "").split("/").pop();
      if (!channelId) return;

      let msg = rawMessage;
      if (typeof rawMessage === "string") {
        try {
          msg = JSON.parse(rawMessage);
        } catch (e) {

          msg = rawMessage;
        }
      }

      if (msg && typeof msg === "object" && "type" in msg && msg.type !== "message") {
        return;
      }

      if (channelTypeMap[channelId] && channelTypeMap[channelId] !== "TEXT") {
        return;
      }

      setMessages((prev) => ({
        ...prev,
        [channelId]: [...(prev[channelId] || []), msg]
      }));

      if (channelId === currentChannelRef.current) return;

      setUnread((prev) => ({
        ...prev,
        [channelId]: Math.min((prev[channelId] || 0) + 1, 99)
      }));
    });

    return () => {
      if (typeof unsub === "function") {
        try { unsub(); } catch (e) {}
      }
    };

  }, [channelTypeMap]);

  useEffect(() => {
    if (currentChannel.type === "TEXT") {
      setUnread((prev) => ({
        ...prev,
        [currentChannel.id]: 0
      }));
    }
  }, [currentChannel.id, currentChannel.type]);

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

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside AppProvider");
  }
  return context;
}
