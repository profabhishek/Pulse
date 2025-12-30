import { useState, useRef, useEffect } from "react";
import { useApp } from "../state/appStore";
import { publishTextMessage } from "../services/mqttService";
import "../styles/messageInput.css";

const FALLBACK_EMOJI = ["😀","😁","😂","🤣","😊","😍","🤔","👍","👎","🎉","🔥","💯","❤️","🤝","🙌"];

export default function MessageInput({ profile }) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const { currentChannel } = useApp();
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    // auto-resize textarea
    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  }, [text, attachments]);

  const sendMessage = async () => {
    if (!text.trim() && attachments.length === 0) return;

    const payload = {
      userId: profile.user_id,
      name: profile.name,
      avatar: profile.avatar_path,
      text: text.trim(),
      ts: Date.now(),
      files: attachments
    };

    publishTextMessage(currentChannel.id, payload);

    setText("");
    setAttachments([]);
    setShowEmojiPanel(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleAttachClick = async () => {
    try {
      if (window.electronAPI?.openFiles) {
        const files = await window.electronAPI.openFiles();
        if (!files || files.length === 0) return;
        setAttachments(prev => [...prev, ...files]);
        return;
      }
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.onchange = async () => {
        const chosen = Array.from(input.files || []);
        const processed = await Promise.all(chosen.map(async (file) => {
          const buffer = await file.arrayBuffer();
          const b = new Uint8Array(buffer);
          const base64 = btoa(String.fromCharCode(...b));
          return {
            name: file.name,
            mime: file.type || "application/octet-stream",
            size: file.size,
            dataUrl: `data:${file.type || "application/octet-stream"};base64,${base64}`
          };
        }));
        setAttachments(prev => [...prev, ...processed]);
      };
      input.click();
    } catch (err) {
      console.error("Attach error:", err);
    }
  };

  const removeAttachment = (idx) => {
    setAttachments(a => a.filter((_, i) => i !== idx));
  };

  const handleEmojiClick = async () => {
    textareaRef.current?.focus();

    if (!window.electronAPI?.openEmoji) {
      setShowEmojiPanel(s => !s);
      return;
    }

    try {
      const result = await window.electronAPI.openEmoji();

      const nativeOpened = result?.native === true;

      if (!nativeOpened) {
        setShowEmojiPanel(s => !s);
      }
    } catch (err) {
      console.error("Emoji open error:", err);
      setShowEmojiPanel(s => !s);
    }
  };


  const insertEmoji = (emoji) => {
    const el = textareaRef.current;
    if (!el) {
      setText(t => t + emoji);
      return;
    }

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setText(newText);

    requestAnimationFrame(() => {
      const caret = start + emoji.length;
      el.selectionStart = el.selectionEnd = caret;
      el.focus();
    });
  };

  return (
    <div style={{ position: "relative" }}>
      <div className="composer-shell">
        <button className="icon-btn" title="Attach" onClick={handleAttachClick}>＋</button>

        <button className="icon-btn" title="Emoji" onClick={handleEmojiClick}>😊</button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${currentChannel.id}`}
          rows={1}
        />

        <button
          className={`send-btn ${text.trim() || attachments.length ? "active" : ""}`}
          onClick={sendMessage}
          title="Send"
        >
          ➤
        </button>
      </div>

      {attachments.length > 0 && (
        <div style={{
          display: "flex",
          gap: 10,
          padding: "6px 16px 14px 16px",
          flexWrap: "wrap"
        }}>
          {attachments.map((f, idx) => (
            <div key={idx} style={{
              width: 96,
              minWidth: 96,
              borderRadius: 8,
              overflow: "hidden",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.04)",
              position: "relative",
              padding: 6
            }}>

              {f.mime?.startsWith("image/") && (
                <img src={f.dataUrl} alt={f.name} style={{ width: "100%", height: 64, objectFit: "cover", borderRadius: 6 }} />
              )}
              {f.mime?.startsWith("video/") && (
                <video src={f.dataUrl} style={{ width: "100%", height: 64, objectFit: "cover" }} controls />
              )}
              {f.mime === "application/pdf" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 64 }}>
                  <span style={{ fontSize: 28 }}>📄</span>
                </div>
              )}
              <div style={{ marginTop: 6, fontSize: 12, color: "#b5bac1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>

              <button onClick={() => removeAttachment(idx)} style={{
                position: "absolute",
                top: 6,
                right: 6,
                background: "rgba(0,0,0,0.5)",
                border: "none",
                color: "#fff",
                borderRadius: 6,
                padding: "2px 6px",
                cursor: "pointer"
              }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {showEmojiPanel && (
        <div style={{
          position: "absolute",
          bottom: "72px",
          left: 16,
          background: "linear-gradient(180deg, rgba(30,30,30,0.98), rgba(20,20,20,0.98))",
          border: "1px solid rgba(255,255,255,0.06)",
          padding: 8,
          borderRadius: 10,
          boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
          zIndex: 1200,
        }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", maxWidth: 420 }}>
            {FALLBACK_EMOJI.map((e) => (
              <button key={e} onClick={() => insertEmoji(e)} style={{
                fontSize: 20,
                padding: 6,
                background: "transparent",
                border: "none",
                cursor: "pointer"
              }}>{e}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
