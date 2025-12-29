import { useApp } from "../state/appStore";
import MessageInput from "./MessageInput";
import "../styles/chatView.css";

export default function ChatView({ profile }) {
  const { currentChannel, messages } = useApp();
  const channelMessages = messages[currentChannel.id] || [];

  return (
    <div className="chat-view">

      <div className="chat-header">
        <span className="hash">#</span>
        <span className="channel-name">{currentChannel.id}</span>
      </div>

      <div className="chat-messages">
        {channelMessages.map((msg, i) => {
          const prev = channelMessages[i - 1];
          const showAvatar = !prev || prev.name !== msg.name;

          return (
            <div key={i} className="message-row">
              {showAvatar ? (
                <img
                  src={`pulse-avatar://${msg.avatar}`}
                  className="avatar"
                />
              ) : (
                <div className="avatar-spacer" />
              )}

              <div className="message-content">
                {showAvatar && (
                  <div className="message-header">
                    <span className="username">{msg.name}</span>
                    <span className="timestamp">just now</span>
                  </div>
                )}
                <div className="message-text">{msg.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput profile={profile} />
    </div>
  );
}
