import React from "react";

export default function SpeakerIcon({ size = 16*1.5 }) {
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
        d="M3 10v4a1 1 0 0 0 1 1h3l4 4V5L7 9H4a1 1 0 0 0-1 1Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M14 9a4 4 0 0 1 0 6M16 7a7 7 0 0 1 0 10"
      />
    </svg>
  );
}
