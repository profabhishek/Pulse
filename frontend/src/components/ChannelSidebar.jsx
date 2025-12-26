import { useApp } from "../state/appStore";
import SpeakerIcon from "./icons/SpeakerIcon";
import TextChannelIcon from "./icons/TextChannelIcon";

export default function ChannelSidebar() {
  const { currentChannel, setCurrentChannel, unread } = useApp();

  const isActive = (id) => currentChannel.id === id;

  const renderUnread = (count) => {
    if (!count) return null;
    return (
      <span className="unread-badge">
        {count >= 10 ? "9+" : count}
      </span>
    );
  };

  return (
    <div style={{ width: "240px", background: "#2b2d31", padding: "10px" }}>
      <h4>TEXT</h4>

      <div
        className={`channel ${isActive("general") ? "active" : ""}`}
        onClick={() => setCurrentChannel({ id: "general", type: "TEXT" })}
      >
        <TextChannelIcon />
        <span>general</span>
        {renderUnread(unread.general)}
      </div>

      <div
        className={`channel ${isActive("random") ? "active" : ""}`}
        onClick={() => setCurrentChannel({ id: "random", type: "TEXT" })}
      >
        <TextChannelIcon />
        <span>random</span>
        {renderUnread(unread.random)}
      </div>

      <h4 style={{ marginTop: "20px" }}>VOICE</h4>

      <div
        className={`channel ${isActive("gaming") ? "active" : ""}`}
        onClick={() => setCurrentChannel({ id: "gaming", type: "VOICE" })}
        style={{ fontSize: "15px" }}
      >
        <SpeakerIcon />
        Gaming
      </div>
    </div>
  );
}
