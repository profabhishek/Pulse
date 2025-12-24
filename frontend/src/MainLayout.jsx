import ServerBar from "./components/ServerBar";
import ChannelSidebar from "./components/ChannelSidebar";
import ChatView from "./components/ChatView";
import VoiceView from "./components/VoiceView";
import { useApp } from "./state/appStore";

export default function MainLayout({ profile, onEditProfile }) {
  const { currentChannel } = useApp();

  return (
    <div className="app">
      <ServerBar profile={profile} onEditProfile={onEditProfile} />
      <ChannelSidebar />
      {currentChannel.type === "TEXT" ? <ChatView profile={profile} /> : <VoiceView />}
    </div>
  );
}
