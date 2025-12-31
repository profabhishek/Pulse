import React, { useEffect, useState, useRef } from "react";
import MessageInput from "./MessageInput";
import { useApp } from "../state/appStore";
import "../styles/chatView.css";

function Attachment({ file, onOpen }) {
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

  const src = objectUrl || file.dataUrl;
  const downloadHref = src;

  const containerStyle = {
    width: 320,
    maxWidth: "100%",
    borderRadius: 12,
    overflow: "hidden",
    background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
    border: "1px solid rgba(255,255,255,0.04)",
    padding: 8,
    marginTop: 8,
    boxShadow: "0 8px 30px rgba(2,6,23,0.6), inset 0 1px 0 rgba(255,255,255,0.02)"
  };

  if (file.mime?.startsWith("image/")) {
    return (
      <div style={containerStyle} className="attachment-card">
        {isLoading ? (
          <div className="attachment-loading" style={{ height: 180 }}>Loading…</div>
        ) : (
          <img
            src={src}
            alt={file.name}
            loading="lazy"
            style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 10, display: "block", cursor: "zoom-in" }}
            onClick={() => onOpen({ type: "image", src, name: file.name })}
          />
        )}
        <div className="attachment-meta">
          <div className="attachment-actions">
            <a className="attachment-download" href={downloadHref} download={file.name}>Download</a>
          </div>
        </div>
      </div>
    );
  }

  if (file.mime?.startsWith("video/")) {
    return (
      <div style={containerStyle} className="attachment-card">
        {isLoading ? (
          <div className="attachment-loading" style={{ height: 180 }}>Loading…</div>
        ) : (
          <div style={{ position: "relative", width: "100%", height: 180, borderRadius: 10, overflow: "hidden", cursor: "pointer" }}>
            <video
              src={src}
              preload="metadata"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <button
              className="attachment-play-overlay"
              onClick={() => onOpen({ type: "video", src, name: file.name })}
              aria-label="Open video"
            >
              ▶
            </button>
          </div>
        )}
        <div className="attachment-meta">
          <div className="attachment-actions">
            <a className="attachment-download" href={downloadHref} download={file.name}>Download</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", ...containerStyle }} className="attachment-card">
      <div style={{ fontSize: 28 }}>📄</div>
      <div style={{ flex: 1 }}>
        <div style={{ color: "var(--text-primary)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
        <a className="attachment-download" href={objectUrl || file.dataUrl} download={file.name}>Download</a>
      </div>
    </div>
  );
}

function MediaModal({ open, item, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !item) return null;

  const { type, src, name } = item;

  return (
    <div className="media-modal" role="dialog" aria-modal="true" aria-label={name || "media viewer"}>
      <div className="media-modal-backdrop" onClick={onClose} />
      <div className="media-modal-body">
        <button className="media-modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="media-modal-content">
          {type === "image" ? (
            <img src={src} alt={name} className="media-modal-image" />
          ) : (
            <video src={src} controls className="media-modal-video" />
          )}
        </div>

        <div className="media-modal-footer">
          <div className="media-modal-name">{name}</div>
          <div className="media-modal-actions">
            <a className="btn btn-download" href={src} download={name}>Download</a>
            <a className="btn btn-open" href={src} target="_blank" rel="noopener noreferrer">Open in new tab</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatView({ profile }) {
  const { currentChannel, messages } = useApp();
  const channelMessages = messages?.[currentChannel?.id] || [];

  const messagesRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const [modalItem, setModalItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;

    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 80;
      setIsAtBottom(atBottom);
      setShowScrollButton(!atBottom);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    if (isAtBottom) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [channelMessages.length, isAtBottom]);

  const scrollToBottom = () => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  const openMedia = (item) => {
    setModalItem(item);
    setModalOpen(true);
  };
  const closeMedia = () => {
    setModalOpen(false);
    setTimeout(() => setModalItem(null), 240);
  };

const safeOpenExternal = (url) => {

  if (window?.electronAPI?.openExternal) {
    try {
      window.electronAPI.openExternal(url);
      return;
    } catch (e) {
      console.error("openExternal failed:", e);
    }
  }
  if (typeof window !== "undefined" && window.open) {
    window.open(url, "_blank");
  }
};


  const linkifyText = (text) => {
    if (!text) return text;
    const urlRe = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRe);
    return parts.map((part, idx) => {
      if (part.startsWith("http://") || part.startsWith("https://")) {
        return (
          <a
            key={`link-${idx}`}
            href={part}
            className="message-link"
            onClick={(e) => {
              e.preventDefault();

              if (window?.electronAPI?.openExternal) {
                window.electronAPI.openExternal(part);
              }
            }}
          >
            {part}
          </a>
        );
      }
      return <span key={`txt-${idx}`}>{part}</span>;
    });
  };

  const makeMessageKey = (msg, i) => {
    if (msg?.id) return msg.id;
    const name = msg?.name ?? "u";
    const ts = msg?.timestamp ?? msg?.time ?? msg?.createdAt ?? `i${i}`;
    const textSlice = String(msg?.text ?? "").slice(0, 30).replace(/\s+/g, "_");
    return `${name}-${ts}-${textSlice}-${i}`;
  };

  return (
    <div className="chat-view">
      <div className="chat-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="hash">#</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="channel-name">{currentChannel?.id}</span>
            <span className="channel-sub tiny">Text channel • {channelMessages.length} messages</span>
          </div>
        </div>
      </div>

      <div className="chat-messages" ref={messagesRef} aria-live="polite">
        {channelMessages.map((msg, i) => {
          const prev = channelMessages[i - 1];
          const showAvatar = !prev || prev.name !== msg.name;
          const rowKey = makeMessageKey(msg, i);

          return (
            <div key={rowKey} className="message-row">
              {showAvatar ? (
                <img
                  src={msg.avatar ? `pulse-avatar://${msg.avatar}` : undefined}
                  className="avatar-profile"
                  alt={msg.name || "avatar"}
                  onError={(e) => {
                    e.currentTarget.style.visibility = "hidden";
                  }}
                />
              ) : (
                <div className="avatar-profile-spacer" />
              )}

              <div className="message-content">
                {showAvatar && (
                  <div className="message-header">
                    <span className="username">{msg.name}</span>
                    <span className="timestamp">just now</span>
                  </div>
                )}

                <div className="message-text">
                  <div
                    style={{
                      color: "var(--text-primary)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word"
                    }}
                  >
                    {linkifyText(msg.text || "")}
                  </div>

                  {Array.isArray(msg.files) && msg.files.length > 0 && (
                    <div
                      className="attachments"
                      style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        marginTop: 12
                      }}
                    >
                      {msg.files.map((file, idx) => (
                        <Attachment
                          key={`${file.name}-${file.size || idx}`}
                          file={file}
                          onOpen={openMedia}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>


      {showScrollButton && (
        <button className="scroll-to-bottom" onClick={scrollToBottom} aria-label="Jump to latest message">
          ↓
        </button>
      )}

      <div className="chat-input-wrapper">
        <MessageInput profile={profile} />
      </div>

      <MediaModal open={modalOpen} item={modalItem} onClose={closeMedia} />
    </div>
  );
}
