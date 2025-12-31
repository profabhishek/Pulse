import { useState } from "react";

export default function ProfileModal({ onComplete, existingProfile }) {
  const [name, setName] = useState(existingProfile?.name || "");
  const [toast, setToast] = useState("");
  const originalName = existingProfile?.name || "";
  const originalAvatar = existingProfile?.avatar_path || "";

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
      await window.pulse.saveProfile({ name, avatarPath });
      setToast("Profile updated successfully");
      setTimeout(() => {
        setToast("");
        onComplete();
      }, 1200);
    } catch {
      setError("Failed to save profile");
    }
  };

  const isChanged =
    name !== originalName || avatarPath !== originalAvatar;

  const canClose = !!existingProfile;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        {canClose && (
          <button className="close-btn" onClick={onComplete} title="Close">
            ✕
          </button>
        )}

        <h2 className="title">
          {existingProfile ? "Edit Profile" : "Welcome"}
        </h2>
        <p className="subtitle">
          {existingProfile
            ? "Refine how you appear to others"
            : "Let’s set up your identity"}
        </p>

        <div className="avatar-section">
          <div className="avatar-ring">
            {avatarPath ? (
              <img src={`pulse-avatar://${avatarPath}`} alt="avatar" />
            ) : (
              <span className="avatar-placeholder">?</span>
            )}
          </div>

          <button
            className="secondary-btn"
            onClick={pickAvatar}
            disabled={pickingAvatar}
          >
            {pickingAvatar
              ? "Selecting Avatar…"
              : avatarPath
              ? "Change Avatar"
              : "Choose Avatar"}
          </button>
        </div>

        <div className="field">
          <label>Your Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>

        {error && <div className="error">{error}</div>}

      <button
        className="primary-btn"
        disabled={!name || !avatarPath || !isChanged}
        onClick={save}
        style={{ marginTop: "36px" }}
      >
        Save Profile
      </button>


        <style>{`
          .modal-backdrop {
            position: fixed;
            inset: 0;
            background: radial-gradient(
              circle at top,
              rgba(120,140,255,0.15),
              rgba(0,0,0,0.85)
            );
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(14px);
            z-index: 1000;
          }

          .modal-card {
            width: 420px;
            max-width: 92%;
            background: linear-gradient(180deg, #16181d, #0f1115);
            border-radius: 20px;
            padding: 28px 26px 30px;
            position: relative;
            box-shadow:
              0 40px 120px rgba(0,0,0,0.7),
              inset 0 1px 0 rgba(255,255,255,0.05);
            color: #eef0f4;
            animation: pop 0.35s ease;
          }

          @keyframes pop {
            from {
              transform: scale(0.96) translateY(10px);
              opacity: 0;
            }
            to {
              transform: scale(1) translateY(0);
              opacity: 1;
            }
          }

          .close-btn {
            position: absolute;
            top: 14px;
            right: 14px;
            background: transparent;
            border: none;
            color: #9aa0ab;
            font-size: 18px;
            cursor: pointer;
            transition: color 0.2s;
          }

          .close-btn:hover {
            color: #ffffff;
          }

          .title {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            text-align: center;
            letter-spacing: 0.2px;
          }

          .subtitle {
            margin: 6px 0 24px;
            text-align: center;
            font-size: 14px;
            color: #a5aab5;
          }

          .avatar-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 14px;
            margin-bottom: 24px;
          }

          .avatar-ring {
            width: 96px;
            height: 96px;
            border-radius: 50%;
            padding: 3px;
            background: linear-gradient(135deg, #7c8cff, #4fd1c5);
            box-shadow: 0 0 0 6px rgba(124,140,255,0.12);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .avatar-ring img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            background: #2a2d34;
          }

          .avatar-placeholder {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: #2a2d34;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: #6b7280;
          }

          .field {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 22px;
          }

          .field label {
            font-size: 12px;
            color: #9aa0ab;
          }

          .field input {
            height: 44px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.08);
            background: #0c0e12;
            color: #ffffff;
            padding: 0 14px;
            font-size: 14px;
            outline: none;
            transition: border 0.2s, box-shadow 0.2s;
          }

          .field input:focus {
            border-color: #7c8cff;
            box-shadow: 0 0 0 3px rgba(124,140,255,0.25);
          }

          .primary-btn {
            width: 100%;
            height: 46px;
            border-radius: 12px;
            border: none;
            background: linear-gradient(135deg, #7c8cff, #4fd1c5);
            color: #0b0d12;
            font-weight: 600;
            font-size: 15px;
            cursor: pointer;
            transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          }

          .primary-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 10px 30px rgba(124,140,255,0.35);
          }

          .primary-btn:disabled {
            opacity: 0.45;
            cursor: not-allowed;
          }

          .secondary-btn {
            border-radius: 999px;
            padding: 8px 18px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.03);
            color: #e5e7eb;
            font-size: 13px;
            cursor: pointer;
            transition: background 0.2s, border 0.2s;
          }

          .secondary-btn:hover:not(:disabled) {
            background: rgba(255,255,255,0.08);
            border-color: rgba(255,255,255,0.2);
          }

          .secondary-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .error {
            margin-bottom: 14px;
            font-size: 13px;
            color: #ff6b6b;
            text-align: center;
          }
          .toast-success {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #4fd1c5, #7c8cff);
            color: #0b0d12;
            padding: 12px 20px;
            border-radius: 999px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 12px 40px rgba(0,0,0,0.35);
            animation: toast-drop 0.35s ease;
            z-index: 9999;
            white-space: nowrap;
          }

          @keyframes toast-drop {
            from {
              transform: translate(-50%, -10px);
              opacity: 0;
            }
            to {
              transform: translate(-50%, 0);
              opacity: 1;
            }
          }

        `}</style>
      </div>
      {toast && (
        <div className="toast-success">
          {toast}
        </div>
      )}

    </div>
  );
}
