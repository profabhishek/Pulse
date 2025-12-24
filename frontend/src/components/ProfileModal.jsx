import { useState } from "react";

export default function ProfileModal({ onComplete, existingProfile }) {
  const [name, setName] = useState(existingProfile?.name || "");
  const [avatarPath, setAvatarPath] = useState(
    existingProfile?.avatar_path || ""
  );
  const [error, setError] = useState("");
  const [pickingAvatar, setPickingAvatar] = useState(false);

  const pickAvatar = async () => {
    if (pickingAvatar) return;

    setPickingAvatar(true);

    try {
      const path = await window.pulse.pickAvatar();
      if (!path) return;

      setError("");
      setAvatarPath(path);
    } finally {
      setPickingAvatar(false);
    }
  };

  const save = async () => {
    if (!name || !avatarPath) return;

    try {
      await window.pulse.saveProfile({
        name,
        avatarPath
      });
      onComplete();
    } catch {
      setError("Failed to save profile");
    }
  };

  const canClose = !!existingProfile;

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ position: "relative" }}>
        {/* Close button (edit mode only) */}
        {canClose && (
          <button
            onClick={onComplete}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "transparent",
              border: "none",
              color: "#b5bac1",
              fontSize: "18px",
              cursor: "pointer"
            }}
            title="Close"
          >
            ✕
          </button>
        )}

        <h2>{existingProfile ? "Edit profile" : "Set up your profile"}</h2>

        <input
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        {/* Change Avatar button (only this moves down) */}
        <button
          onClick={pickAvatar}
          disabled={pickingAvatar}
          style={{
            marginTop: "36px",
            opacity: pickingAvatar ? 0.6 : 1,
            cursor: pickingAvatar ? "not-allowed" : "pointer"
          }}
        >
          {pickingAvatar
            ? "Selecting Avatar…"
            : avatarPath
            ? "Change Avatar"
            : "Choose Avatar"}
        </button>

        {/* Avatar preview (unchanged position) */}
        {avatarPath && (
          <img
            src={`pulse-avatar://${avatarPath}`}
            width={64}
            height={64}
            style={{
              borderRadius: "50%",
              marginTop: "10px",
              objectFit: "cover",
              background: "#444"
            }}
          />
        )}

        {error && (
          <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
        )}

        {/* Save Profile button (only this moves down) */}
        <button
          disabled={!name || !avatarPath}
          onClick={save}
          style={{ marginTop: "36px" }}
        >
          Save Profile
        </button>
      </div>
    </div>
  );
}
