import { useApp } from "../state/appStore";
import SpeakerIcon from "./icons/SpeakerIcon";
import TextChannelIcon from "./icons/TextChannelIcon";

export default function ChannelSidebar() {
  const { currentChannel, setCurrentChannel } = useApp();

  const isActive = (id) => currentChannel.id === id;

  return (
    <div style={{ width: "240px", background: "#2b2d31", padding: "10px" }}>
      <h4>TEXT</h4>

      <div
        className={`channel ${isActive("general") ? "active" : ""}`}
        onClick={() => setCurrentChannel({ id: "general", type: "TEXT" })}
      >
        <TextChannelIcon />
        general
      </div>

      <div
        className={`channel ${isActive("random") ? "active" : ""}`}
        onClick={() => setCurrentChannel({ id: "random", type: "TEXT" })}
      >
        <TextChannelIcon />
        random
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
