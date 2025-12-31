// src/components/VoiceView.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import SimplePeer from "simple-peer";
import { publish, getClientId } from "../services/mqttService"; // must exist
import mic from "../assets/mic.svg";
import micOff from "../assets/mic-off.svg";
import deafen from "../assets/deafen.svg";
import deafenOff from "../assets/deafen-off.svg";
import callEnd from "../assets/call-end.svg";
import "../styles/voiceView.css";

const BASE_TOPIC = "pulse/dev/sugardaddy";

export default function VoiceView({
  channelId = "gaming",
  onMute = () => {},
  onDeafen = () => {},
  onLeave = () => {}
}) {
  // stable client id: prefer mqttService.getClientId(), fallback to localStorage
  const clientId = useMemo(() => {
    const svcId = getClientId && getClientId();
    if (svcId) return svcId;
    const key = "pulse_client_id";
    const stored = localStorage.getItem(key);
    if (stored) return stored;
    const generated = `c_${Date.now().toString(36)}_${Math.random().toString(36, 7).slice(2, 8)}`;
    localStorage.setItem(key, generated);
    return generated;
  }, []);

  const [profile, setProfile] = useState(null); // { user_id, name, avatar_path, ... }
  const [participants, setParticipants] = useState([]); // [{ id, name, avatar }]
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [speakers, setSpeakers] = useState(new Set());

  const localStreamRef = useRef(null);
  const peersRef = useRef({}); // map targetId -> { peer, audioEl, cleanup }
  const audioContainerRef = useRef(null);

  const presenceTopic = `${BASE_TOPIC}/voice/presence/${channelId}`;
  const signalingTopicFor = (targetId) => `${BASE_TOPIC}/voice/signaling/${channelId}/${targetId}`;

  // ---- load profile once ----
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (window?.pulse?.getProfile) {
          const p = await window.pulse.getProfile();
          if (mounted) setProfile(p || null);
        } else {
          if (mounted) setProfile(null);
        }
      } catch (e) {
        console.error("VoiceView: error loading profile", e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!profile) return;

    publish(presenceTopic, {
      type: "join",
      id: clientId,
      name: profile.name || clientId,
      avatar: profile.avatar_path || null
    });

    return () => {
      publish(presenceTopic, {
        type: "leave",
        id: clientId
      });
    };
  }, [profile, clientId, channelId]);

  useEffect(() => {
    let mounted = true;
    async function initMic() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          s.getTracks().forEach(t => t.stop());
          return;
        }
        localStreamRef.current = s;
        startLocalSpeakingDetection(s);
      } catch (err) {
        console.error("VoiceView: getUserMedia failed", err);
      }
    }
    initMic();

    return () => {
      mounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      stopLocalSpeakingDetection();
    };
  }, []);

  useEffect(() => {
    function onPresence(e) {
      const { type, id, name, avatar } = e.detail || {};
      if (!id) return;

      if (id === clientId) return;

      setParticipants(prev => {
        if (type === "join") {
          if (prev.find(p => p.id === id)) return prev;
          return [...prev, { id, name: name || id, avatar: avatar || null }];
        }
        if (type === "leave") {
          cleanupPeer(id);
          return prev.filter(p => p.id !== id);
        }
        return prev;
      });
    }

    function onSignal(e) {
      const { from, data } = e.detail || {};
      if (!from || !data) return;
      handleSignal(from, data);
    }

    window.addEventListener("voice-presence", onPresence);
    window.addEventListener("voice-signal", onSignal);

    return () => {
      window.removeEventListener("voice-presence", onPresence);
      window.removeEventListener("voice-signal", onSignal);
    };
  }, [clientId, channelId]);

  useEffect(() => {
    participants.forEach(p => {
      if (p.id === clientId) return;
      if (!peersRef.current[p.id]) {
        const initiator = clientId < p.id;
        createPeer(p.id, initiator);
      }
    });
  }, [participants]);

  function createPeer(targetId, initiator = false) {
    if (!localStreamRef.current) {
      setTimeout(() => createPeer(targetId, initiator), 300);
      return;
    }
    if (peersRef.current[targetId]) return;

    const peer = new SimplePeer({
      initiator,
      trickle: true,
      stream: localStreamRef.current,
      config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }
    });

    peer.on("signal", data => {
      try {
        publish(signalingTopicFor(targetId), { from: clientId, data });
      } catch (e) {
        console.error("VoiceView: publish signal failed", e);
      }
    });

    peer.on("connect", () => {
      console.info("Peer connected to", targetId);
    });

    peer.on("error", err => {
      console.error("Peer error", targetId, err);
    });

    peer.on("stream", remoteStream => {
      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.playsInline = true;
      try {
        audio.srcObject = remoteStream;
      } catch (err) {
        audio.src = URL.createObjectURL(remoteStream);
      }
      audio.volume = deafened ? 0 : 1;
      audio.dataset.peer = targetId;
      if (audioContainerRef.current) audioContainerRef.current.appendChild(audio);

      const cleanup = setupSpeakingDetection(remoteStream, targetId);

      peersRef.current[targetId] = { peer, audioEl: audio, _cleanupAudioDetect: cleanup };
    });

    peersRef.current[targetId] = { peer, audioEl: null, _cleanupAudioDetect: null };
    return peer;
  }

  function handleSignal(from, data) {
    if (!peersRef.current[from]) {
      createPeer(from, false);
    }
    const entry = peersRef.current[from];
    if (entry && entry.peer) {
      try {
        entry.peer.signal(data);
      } catch (e) {
        console.error("VoiceView: signal error", e);
      }
    } else {
      setTimeout(() => handleSignal(from, data), 200);
    }
  }

  function setupSpeakingDetection(stream, targetId) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const src = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      let raf = null;

      const tick = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        if (avg > 18) {
          setSpeakers(prev => {
            const s = new Set(prev);
            s.add(targetId);
            return s;
          });
        } else {
          setSpeakers(prev => {
            const s = new Set(prev);
            s.delete(targetId);
            return s;
          });
        }
        raf = requestAnimationFrame(tick);
      };

      tick();

      return () => {
        if (raf) cancelAnimationFrame(raf);
        audioCtx.close().catch(() => {});
      };
    } catch (e) {
      console.warn("VoiceView: speaking detection failed", e);
      return () => {};
    }
  }

  const localAudioDetectRef = useRef(null);
  function startLocalSpeakingDetection(stream) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const src = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      let raf = null;

      const tick = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        if (avg > 18) {
          setSpeakers(prev => {
            const s = new Set(prev);
            s.add(clientId);
            return s;
          });
        } else {
          setSpeakers(prev => {
            const s = new Set(prev);
            s.delete(clientId);
            return s;
          });
        }
        raf = requestAnimationFrame(tick);
      };
      tick();
      localAudioDetectRef.current = () => {
        if (raf) cancelAnimationFrame(raf);
        audioCtx.close().catch(() => {});
      };
    } catch (e) {
      console.warn("VoiceView: local detection failed", e);
    }
  }
  function stopLocalSpeakingDetection() {
    if (localAudioDetectRef.current) {
      localAudioDetectRef.current();
      localAudioDetectRef.current = null;
    }
  }

  function cleanupPeer(id) {
    const entry = peersRef.current[id];
    if (!entry) return;
    try { if (entry.peer) entry.peer.destroy(); } catch (e) {}
    try { if (entry.audioEl && entry.audioEl.parentNode) entry.audioEl.parentNode.removeChild(entry.audioEl); } catch (e) {}
    try { if (entry._cleanupAudioDetect) entry._cleanupAudioDetect(); } catch (e) {}
    delete peersRef.current[id];
    setSpeakers(prev => {
      const s = new Set(prev);
      s.delete(id);
      return s;
    });
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = !next));
    }
    onMute(next);
  }
  function toggleDeafen() {
    const next = !deafened;
    setDeafened(next);
    Object.values(peersRef.current).forEach(e => {
      if (e.audioEl) e.audioEl.volume = next ? 0 : 1;
    });
    if (next) {
      setMuted(true);
      if (localStreamRef.current) localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = false));
    }
    onDeafen(next);
  }
  function leave() {
    publish(presenceTopic, { type: "leave", id: clientId });
    Object.keys(peersRef.current).forEach(k => cleanupPeer(k));
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    onLeave();
  }

  const avatarUrl = profile?.avatar_path ? `pulse-avatar://${profile.avatar_path}` : null;
  const isSpeaking = (id) => speakers.has(id);

  return (
    <div className="voice-wrap" role="region" aria-label={`Voice channel ${channelId}`}>
      <header className="voice-header">
        <div className="title-group">
          <div className="channel-title">{channelId}</div>
          <div className="channel-sub">{participants.length} connected • voice</div>
        </div>
        <div className="session-info"><div className="session-chip">HD</div></div>
      </header>

      <main className="voice-body">
        <div className="users-grid" style={{ "--cols": Math.ceil(Math.sqrt(Math.max(1, participants.length + 1))) }}>
          <article
            className={`user-card ${isSpeaking(clientId) ? "speaking" : ""}`}
            aria-live="polite"
          >
            <div className="user-top">
              <div className={`avatar-ring ${isSpeaking(clientId) ? "pulse" : ""}`}>
                <div className="avatar">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={profile?.name || "You"}
                      className="avatar-img"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <span className="avatar-fallback">
                      {(profile?.name || clientId)[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 👇 NAME AT CARD BOTTOM-RIGHT */}
            <div className="user-meta">
              <div className="user-name">
                {profile?.name ? `${profile.name} • You` : `${clientId} • You`}
              </div>
            </div>

            <div className="user-bottom">
              <div className={`presence-dot ${isSpeaking(clientId) ? "online" : "idle"}`} />
            </div>
          </article>


          {participants.map(p => (
            <article key={p.id} className={`user-card ${isSpeaking(p.id) ? "speaking" : ""}`} aria-live="polite">
              <div className="user-top">
                <div className={`avatar-ring ${isSpeaking(p.id) ? "pulse" : ""}`}>
                  <div className="avatar">
                    {p.avatar ? (
                      <img src={`pulse-avatar://${p.avatar}`} alt={p.name} className="avatar-img" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    ) : (
                      <span className="avatar-fallback">{(p.name || p.id)[0].toUpperCase()}</span>
                    )}
                  </div>
                </div>

                <div className="user-meta">
                  <div className="user-name">{p.name || p.id}</div>
                  <div className="user-role">Participant</div>
                </div>
              </div>

              <div className="user-bottom">
                <div className={`presence-dot ${isSpeaking(p.id) ? "online" : "idle"}`} />
              </div>
            </article>
          ))}
        </div>

        <div style={{ display: "none" }} ref={audioContainerRef} />
      </main>

      <footer className="voice-footer">
        <div className="controls-left">
          <button className={`primary-control ${muted ? "active" : ""}`} onClick={toggleMute} title={muted ? "Unmute" : "Mute"}>
            <img src={muted ? micOff : mic} alt="Mute" className="control-icon-img" />
          </button>
          <button className={`primary-control ${deafened ? "active" : ""}`} onClick={toggleDeafen} title={deafened ? "Undeafen" : "Deafen"}>
            <img src={deafened ? deafenOff : deafen} alt="Deafen" className="control-icon-img" />
          </button>
        </div>

        <div className="controls-right">
          <button className="hangup-btn" onClick={leave} title="Disconnect">
            <img src={callEnd} alt="Disconnect" className="control-icon-img hangup-icon-img" />
          </button>
        </div>
      </footer>
    </div>
  );
}

// React js final boss