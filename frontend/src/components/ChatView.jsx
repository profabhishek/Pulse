import { useApp } from "../state/appStore";
import MessageInput from "./MessageInput";

export default function ChatView({ profile }) {
  const { currentChannel, messages } = useApp();

  const channelMessages = messages[currentChannel.id] || [];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "10px", borderBottom: "1px solid #1e1f22" }}>
        # {currentChannel.id}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: "10px", overflowY: "auto" }}>
        {channelMessages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "8px"
            }}
          >
            <img
              src={`pulse-avatar://${msg.avatar}`}
              width={28}
              height={28}
              style={{
                borderRadius: "50%",
                marginRight: "8px",
                background: "#444"
              }}
            />
            <b style={{ marginRight: "6px" }}>{msg.name}</b>
            <span>{msg.text}</span>
          </div>
        ))}
      </div>

      {/* Input */}
      <MessageInput profile={profile} />
    </div>
  );
}
