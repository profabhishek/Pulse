import { useState } from "react";
import { useApp } from "../state/appStore";
import { publishTextMessage } from "../services/mqttService";

export default function MessageInput({ profile }) {
  const [text, setText] = useState("");
  const { currentChannel } = useApp();

  const sendMessage = () => {
    if (!text.trim()) return;

    publishTextMessage(currentChannel.id, {
      userId: profile.user_id,
      name: profile.name,
      avatar: profile.avatar_path,
      text,
      ts: Date.now()
    });

    setText("");
  };

  return (
    <div style={{ padding: "10px" }}>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === "Enter" && sendMessage()}
        placeholder={`Message #${currentChannel.id}`}
        style={{
          width: "100%",
          padding: "10px",
          background: "#383a40",
          border: "none",
          borderRadius: "6px",
          color: "white"
        }}
      />
    </div>
  );
}
