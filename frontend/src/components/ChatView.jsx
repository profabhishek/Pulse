import { useApp } from "../state/appStore";
import MessageInput from "./MessageInput";
import "../styles/chatView.css";
import { useEffect, useState } from "react";

function Attachment({ file }) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(file.dataUrl));

  useEffect(() => {
    let mounted = true;
    if (!file?.dataUrl) {
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        setIsLoading(true);
        const res = await fetch(file.dataUrl);
        const blob = await res.blob();
        if (!mounted) return;
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);
      } catch (err) {
        console.error("Attachment blob conversion failed:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };

  }, [file.dataUrl]);

  const containerStyle = {
    width: 320,
    maxWidth: "100%",
    borderRadius: 10,
    overflow: "hidden",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.04)",
    padding: 8,
    marginTop: 8
  };

  if (file.mime?.startsWith("image/")) {
    return (
      <div style={containerStyle}>
        {isLoading ? (
          <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>Loading…</div>
        ) : (
          <img
            src={objectUrl || file.dataUrl}
            alt={file.name}
            loading="lazy"
            style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8, display: "block" }}
          />
        )}
        <div style={{ marginTop: 8, fontSize: 12, color: "#b5bac1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {file.name}
        </div>
      </div>
    );
  }

  if (file.mime?.startsWith("video/")) {
    return (
      <div style={containerStyle}>
        {isLoading ? (
          <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>Loading…</div>
        ) : (
          <video
            src={objectUrl || file.dataUrl}
            controls
            preload="metadata"
            style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8, display: "block" }}
          />
        )}
        <div style={{ marginTop: 8, fontSize: 12, color: "#b5bac1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {file.name}
        </div>
      </div>
    );
  }

  return (
    <div style={Object.assign({ display: "flex", gap: 10, alignItems: "center" }, containerStyle)}>
      <div style={{ fontSize: 28 }}>📄</div>
      <div style={{ flex: 1 }}>
        <div style={{ color: "#f2f3f5", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
        <a
          href={objectUrl || file.dataUrl}
          download={file.name}
          style={{ fontSize: 12, color: "#b5bac1", textDecoration: "underline", marginTop: 6, display: "inline-block" }}
        >
          Download
        </a>
      </div>
    </div>
  );
}


export default function ChatView({ profile }) {
  const { currentChannel, messages } = useApp();
  const channelMessages = messages?.[currentChannel?.id] || [];

  return (
    <div className="chat-view">
      <div className="chat-header">
        <span className="hash">#</span>
        <span className="channel-name">{currentChannel?.id}</span>
      </div>

      <div className="chat-messages">
        {channelMessages.map((msg, i) => {
          const prev = channelMessages[i - 1];
          const showAvatar = !prev || prev.name !== msg.name;

          return (
            <div key={i} className="message-row">
              {showAvatar ? (
                <img src={`pulse-avatar://${msg.avatar}`} className="avatar" />
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

                <div className="message-text">
                  <div style={{ color: "var(--text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {msg.text || ""}
                  </div>
                  {Array.isArray(msg.files) && msg.files.length > 0 && (
                    <div className="attachments" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                      {msg.files.map((file, idx) => <Attachment key={idx} file={file} />)}
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      <MessageInput profile={profile} />
    </div>
  );
}
