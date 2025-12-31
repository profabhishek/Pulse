import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import TextChannelIcon from "./icons/TextChannelIcon";
import SpeakerIcon from "./icons/SpeakerIcon";
import PlusIcon from "./icons/PlusIcon";
import { useApp } from "../state/appStore";
import "../styles/ChannelSidebar.css";

export default function ChannelSidebar() {
const { currentChannel, setCurrentChannel, unread, channels } = useApp();


  const [query, setQuery] = useState("");
  const [liveCounts, setLiveCounts] = useState(unread || {});
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setLiveCounts((prev) => ({ ...prev, ...(unread || {}) }));
    return () => {
      mountedRef.current = false;
    };
  }, [unread]);

  // Listen for new message events if preload exposes them (optional)
  useEffect(() => {
    const onNew = (payload) => {
      if (!mountedRef.current) return;
      const { channelId, total, delta = 1 } = payload || {};
      if (!channelId) return;
      setLiveCounts((prev) => {
        const existing = typeof prev[channelId] === "number" ? prev[channelId] : 0;
        const next = typeof total === "number" ? total : Math.max(0, existing + delta);
        return { ...prev, [channelId]: next };
      });
    };

    if (window.messageBus && window.messageBus.onNewMessage) {
      window.messageBus.onNewMessage(onNew);
    } else if (window.electronAPI && window.electronAPI.onNewMessage) {
      // optional electronAPI hook
      window.electronAPI.onNewMessage(onNew);
    }

    return () => {
      if (window.messageBus && window.messageBus.offNewMessage) {
        window.messageBus.offNewMessage(onNew);
      }
    };
  }, []);

  const isActive = (id) => currentChannel?.id === id;

  const renderBadge = (count) => {
    if (!count || count <= 0) return null;
    const label = count >= 100 ? "99+" : count >= 10 ? "9+" : String(count);

    return (
      <motion.span
        className="cs-badge"
        key={label}
        initial={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.7, opacity: 0 }}
        transition={{ type: "spring", stiffness: 450, damping: 28 }}
        aria-label={`${count} unread messages`}
      >
        {label}
      </motion.span>
    );
  };

  const visibleChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <aside className="cs-root" aria-label="Channel sidebar">
      <header className="cs-header">
        <div className="cs-title-group">
          <h3 className="cs-title">Channels</h3>
          <div className="cs-sub">Text &amp; Voice</div>
        </div>

        <div className="cs-actions">
          <button
            className="cs-icon-btn"
            title="Create channel"
            aria-label="Create channel"
            onClick={() => console.log("create channel")}
          >
            <PlusIcon />
          </button>

          <button
            className="cs-icon-btn"
            title="Collapse/expand"
            aria-pressed="false"
            onClick={() => {
              /* optional collapse logic */
            }}
          >
            <svg className="cs-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 9l6 6 6-6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      <div className="cs-search-wrap">
        <input
          className="cs-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search channels..."
          aria-label="Search channels"
        />
      </div>

      <nav className="cs-list" role="navigation" aria-label="Channels list">
        <div className="cs-section">
          <div className="cs-section-header">
            <span className="cs-section-title">Text</span>
            <span className="cs-count">{visibleChannels.filter((c) => c.type === "TEXT").length}</span>
          </div>

          <div className="cs-items">
            {visibleChannels
              .filter((c) => c.type === "TEXT")
              .map((ch) => {
                const active = isActive(ch.id);
                return (
                  <motion.button
                    key={ch.id}
                    className={`cs-item ${active ? "is-active" : ""}`}
                    onClick={() => setCurrentChannel({ id: ch.id, type: ch.type })}
                    whileHover={{ x: 6 }}
                    aria-current={active ? "true" : "false"}
                  >
                    <div className="cs-avatar" aria-hidden>
                      <TextChannelIcon />
                    </div>

                    <div className="cs-meta">
                      <div className="cs-name">{ch.name}</div>
                      <div className="cs-subtext">Text channel</div>
                    </div>

                    <div className="cs-badge-wrap">{renderBadge(liveCounts[ch.id] ?? 0)}</div>
                  </motion.button>
                );
              })}
          </div>
        </div>

        <div className="cs-section">
          <div className="cs-section-header">
            <span className="cs-section-title">Voice</span>
            <span className="cs-count">{visibleChannels.filter((c) => c.type === "VOICE").length}</span>
          </div>

          <div className="cs-items">
            {visibleChannels
              .filter((c) => c.type === "VOICE")
              .map((ch) => {
                const active = isActive(ch.id);
                return (
                  <motion.button
                    key={ch.id}
                    className={`cs-item ${active ? "is-active" : ""}`}
                    onClick={() => setCurrentChannel({ id: ch.id, type: ch.type })}
                    whileHover={{ x: 6 }}
                    aria-current={active ? "true" : "false"}
                  >
                    <div className="cs-avatar" aria-hidden>
                      <SpeakerIcon />
                    </div>

                    <div className="cs-meta">
                      <div className="cs-name">{ch.name}</div>
                      <div className="cs-subtext">Voice channel</div>
                    </div>

                    <div className="cs-badge-wrap">{renderBadge(liveCounts[ch.id] ?? 0)}</div>
                  </motion.button>
                );
              })}
          </div>
        </div>
      </nav>

      <footer className="cs-footer">
        <div className="cs-footer-label">Total unread</div>
        <div className="cs-footer-count">
          {Object.values(liveCounts).reduce((s, n) => s + (Number(n) || 0), 0)}
        </div>
      </footer>
    </aside>
  );
}
