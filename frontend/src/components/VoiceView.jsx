import { useEffect, useMemo, useState } from "react";
import "../styles/voiceView.css";
import mic from "../assets/mic.svg";
import micOff from "../assets/mic-off.svg";
import deafen from "../assets/deafen.svg";
import deafenOff from "../assets/deafen-off.svg";
import callEnd from "../assets/call-end.svg";

export default function VoiceView({
  participants: externalParticipants = null,
  currentUserId = "inder",
  onMute = () => {},
  onDeafen = () => {},
  onLeave = () => {}
}) {
  const defaultParticipants = useMemo(
    () => [
      { id: "Inder", name: "Inder", role: "Nigga" },
      { id: "Black", name: "Black Nigga", role: "Nigga 2.0" },
      { id: "Abhishek", name: "Abhishek", role: "Nigga 3.0" },
      { id: "jhonny", name: "Jhonny sins", role: "Mod" }
    ],
    []
  );

  const participants = externalParticipants || defaultParticipants;
  const n = participants.length;

  // columns = ceil(sqrt(n)) -> 1,2,2,2,3,3,3,3,3,4...
  const cols = Math.max(1, Math.ceil(Math.sqrt(n)));

  // avatar size heuristics (you can tweak numbers)
  const avatarSize =
    cols <= 1 ? 128 : cols === 2 ? 100 : cols === 3 ? 84 : cols === 4 ? 72 : 64;

  const [speakers, setSpeakers] = useState(new Set([participants[0]?.id]));
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      const next = new Set();
      const count = Math.max(1, Math.floor(Math.random() * Math.min(2, participants.length)));
      for (let i = 0; i < count; i++) {
        next.add(participants[Math.floor(Math.random() * participants.length)].id);
      }
      setSpeakers(next);
    }, 900);
    return () => clearInterval(t);
  }, [participants]);

  function toggleMute() {
    setMuted(m => {
      const next = !m;
      onMute(next);
      return next;
    });
  }

  function toggleDeafen() {
    setDeafened(d => {
      const next = !d;
      if (next) setMuted(true);
      onDeafen(next);
      return next;
    });
  }

  function handleLeave() {
    onLeave();
  }

  return (
    <div className="voice-wrap" role="region" aria-label="Voice channel">
      <header className="voice-header">
        <div className="title-group">
          <div className="channel-title">Gaming</div>
          <div className="channel-sub">{participants.length} connected • voice</div>
        </div>

        <div className="session-info">
          <div className="session-chip">HD</div>
          <div className="session-chip">02:13</div>
        </div>
      </header>

      <main className="voice-body">
        <div
          className="users-grid"
          style={{
            "--cols": Math.ceil(Math.sqrt(participants.length))
          }}
        >
          {participants.map((p) => {
            const isSpeaking = speakers.has(p.id);
            const amI = p.id === currentUserId;
            return (
              <article
                key={p.id}
                className={`user-card ${isSpeaking ? "speaking" : ""}`}
                aria-live="polite"
              >
                <div className="user-top">
                  <div className="avatar-stack">
                    <div className="avatar-ring" aria-hidden>
                      <div className="avatar">{p.name[0]}</div>
                    </div>

                    {isSpeaking && (
                      <div className="waveform" aria-hidden>
                        <span style={{"--w":0.9}} />
                        <span style={{"--w":0.6}} />
                        <span style={{"--w":0.75}} />
                        <span style={{"--w":0.5}} />
                        <span style={{"--w":0.85}} />
                      </div>
                    )}
                  </div>

                  <div className="user-meta">
                    <div className="user-name">{p.name}{amI ? " • You" : ""}</div>
                    <div className="user-role">{p.role}</div>
                  </div>
                </div>

                <div className="user-bottom">
                  <div className={`presence-dot ${isSpeaking ? "online" : "idle"}`} />
                  <div className="user-actions">
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      <footer className="voice-footer">
        <div className="controls-left">
          <button
            className={`primary-control ${muted ? "active" : ""}`}
            onClick={toggleMute}
            title={muted ? "Unmute" : "Mute"}
          >
            <img src={muted ? micOff : mic} alt="Mute" className="control-icon-img" />
          </button>

          <button
            className={`primary-control ${deafened ? "active" : ""}`}
            onClick={toggleDeafen}
            title={deafened ? "Undeafen" : "Deafen"}
          >
            <img src={deafened ? deafenOff : deafen} alt="Deafen" className="control-icon-img" />
          </button>
        </div>

        <div className="controls-right">

          <button className="hangup-btn" onClick={handleLeave} title="Disconnect">
            <img src={callEnd} alt="Disconnect" className="control-icon-img hangup-icon-img" />
          </button>
        </div>
      </footer>
    </div>
  );
}
