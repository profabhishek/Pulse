# ⚡ Pulse

> A lightweight, Discord-inspired desktop chat app built with **Electron**, **React**, **MQTT**, and **SQLite**.

Pulse is a **minimal, self-hostable (or broker-based)** communication app focused on:
- ⚡ Fast text messaging
- 🎧 Voice channels (coming next)
- 🖥️ Native desktop experience
- 🧠 Simple architecture you can understand and extend

No accounts. No servers to manage. Just install and chat.

---

## ✨ Features

### ✅ Implemented
- 🗨️ **Text channels** (General, Random)
- 🔔 **Unread message indicators** (with `9+` cap)
- 👤 **User profiles**
  - Username
  - Avatar (locally cached)
- 🖼️ **Message ownership**
  - Your messages styled differently
  - Discord-like layout
- 🪟 **Custom title bar**
  - Centered app branding
  - Minimize / Maximize / Close buttons
- 💾 **Local persistence**
  - SQLite for profile & cache
- 🌍 **Public MQTT broker support**
  - Works across devices instantly
- 🧩 **Electron production build**
  - Windows `.exe` installer

---

## 🚧 Coming Soon
- 🎧 **Voice channels** (WebRTC)
- 🟢 **Presence (online / offline)**
- 🔔 **Desktop notifications**
- 🧑‍🤝‍🧑 **Multiple servers**
- 🔐 Optional authentication layer

---

## 🧠 Tech Stack

| Layer        | Technology |
|-------------|------------|
| Desktop App | Electron |
| UI          | React + Vite |
| Messaging   | MQTT (HiveMQ public broker) |
| Storage     | SQLite (better-sqlite3) |
| IPC         | Electron IPC |
| Styling     | Custom CSS (Discord-inspired) |

---

## 📁 Project Structure

```
pulse/
├── frontend/ # React + Vite UI
│ └── src/
├── electron/ # Electron main process
│ ├── main.js
│ ├── preload.js
│ ├── ipc/
│ └── renderer/ # Built frontend
└── README.md
```