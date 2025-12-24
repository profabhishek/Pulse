import React from "react";

export default function VoiceIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      style={{ marginRight: "6px", flexShrink: 0 }}
    >
      <path
        fill="currentColor"
        d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
      />
    </svg>
  );
}
