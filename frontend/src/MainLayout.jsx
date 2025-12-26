import ServerBar from "./components/ServerBar";
import ChannelSidebar from "./components/ChannelSidebar";
import ChatView from "./components/ChatView";
import VoiceView from "./components/VoiceView";
import { useApp } from "./state/appStore";
import TopBar from "./components/TopBar";

export default function MainLayout({ profile, onEditProfile }) {
  const { currentChannel } = useApp();

  return (
    <div className="app">
      {/* 🔝 Top header */}
      <TopBar />

      {/* 🔽 Main content */}
      <div className="main">
        <ServerBar profile={profile} onEditProfile={onEditProfile} />
        <ChannelSidebar />

        {currentChannel.type === "TEXT" ? (
          <ChatView profile={profile} />
        ) : (
          <VoiceView />
        )}
      </div>
    </div>
  );
}
