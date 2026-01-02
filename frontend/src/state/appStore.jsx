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
      let msg = rawMessage;

      if (typeof rawMessage === "string") {
        try {
          msg = JSON.parse(rawMessage);
        } catch {
          return;
        }
      }

      if (!msg || typeof msg !== "object" || !msg.type) return;

      // =========================
      // 1️⃣ PROFILE MESSAGE
      // =========================
      if (msg.type === "profile") {
        // msg: { type, userId, name, avatarHash }

        // Store latest avatar hash in memory (or DB via IPC later)
        window.__profileCache ??= {};
        const cached = window.__profileCache[msg.userId];

        if (!cached || cached.avatarHash !== msg.avatarHash) {
          window.__profileCache[msg.userId] = {
            name: msg.name,
            avatarHash: msg.avatarHash
          };

          // request avatar ONLY if hash changed
          publish(`${BASE_TOPIC}/avatar/request`, {
            type: "avatar:request",
            userId: msg.userId
          });
        }
        return;
      }

      if (msg.type === "avatar:request") {
        if (msg.userId !== window.__selfUserId) return;

        window.electronAPI?.sendAvatar?.().then((res) => {
        if (!res) return;

        publish(`${BASE_TOPIC}/avatar/response`, {
          type: "avatar:response",
          userId: window.__selfUserId,
          avatarHash: res.avatarHash,
          avatarBase64: res.avatarBase64
        });
      });
      return;

      }

      if (msg.type === "avatar:response") {
        // msg: { userId, avatarHash, avatarBase64 }

        window.electronAPI?.saveAvatar?.(
          msg.userId,
          msg.avatarHash,
          msg.avatarBase64
        );
        return;
      }

      // =========================
      // 4️⃣ NORMAL CHAT MESSAGE
      // =========================
      if (msg.type === "message") {
        const channelId = String(topic || "").split("/").pop();
        if (!channelId) return;

        if (!msg.timestamp) msg.timestamp = Date.now();

        setMessages((prev) => ({
          ...prev,
          [channelId]: [...(prev[channelId] || []), msg]
        }));

        if (channelId !== currentChannelRef.current) {
          setUnread((prev) => ({
            ...prev,
            [channelId]: Math.min((prev[channelId] || 0) + 1, 99)
          }));
        }
      }
    });

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);


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
