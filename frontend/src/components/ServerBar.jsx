export default function ServerBar({ profile, onEditProfile }) {
  return (
    <div
      style={{
        width: "72px",
        background: "#1e1f22",
        padding: "10px",
        display: "flex",
        justifyContent: "center"
      }}
    >
      {profile ? (
        <img
          src={`pulse-avatar://${profile.avatar_path.replace(/\/+$/, "")}`}
          width={40}
          height={40}
          onClick={onEditProfile}
          style={{
            borderRadius: "50%",
            cursor: "pointer",
            objectFit: "cover",
            background: "#444"
          }}
          title="Edit profile"
        />
      ) : (
        <button
          onClick={onEditProfile}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "green",
            color: "white",
            border: "none",
            cursor: "pointer"
          }}
        >
          +
        </button>
      )}
    </div>
  );
}
