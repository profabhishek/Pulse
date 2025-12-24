export default function VoiceView() {
  return (
    <div style={{ flex: 1, padding: "20px" }}>
      <h3>🔊 Gaming</h3>

      <div style={{ marginTop: "20px" }}>
        🟢 Inder (speaking)
      </div>
      <div>⚪ Rahul</div>
      <div>⚪ Aman</div>

      <div style={{ marginTop: "30px" }}>
        <button>Mute</button>
        <button style={{ marginLeft: "10px" }}>Deafen</button>
        <button style={{ marginLeft: "10px" }}>Leave</button>
      </div>
    </div>
  );
}
