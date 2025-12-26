const { ipcMain, dialog, app } = require("electron");
const path = require("path");
const fs = require("fs");
const db = require("../db");

console.log("PROFILE IPC LOADED");
/**
 * Get existing profile
 */
ipcMain.handle("profile:get", () => {
  return db.prepare("SELECT * FROM user_profile LIMIT 1").get() || null;
});

/**
 * Pick avatar image from filesystem
 * Returns ABSOLUTE PATH of selected image
 */
ipcMain.handle("profile:pickAvatar", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "Images", extensions: ["png", "jpg", "jpeg"] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

/**
 * Save profile
 * - Copies avatar into app userData/avatars
 * - Stores ONLY filename in SQLite (important)
 */
ipcMain.handle("profile:save", (_, { name, avatarPath }) => {
  const userDataDir = app.getPath("userData");
  const avatarDir = path.join(userDataDir, "avatars");

  if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
  }

  const ext = path.extname(avatarPath);
  const fileName = `me${ext}`;
  const destPath = path.join(avatarDir, fileName);

  fs.copyFileSync(avatarPath, destPath);

  const userId = "u_" + Date.now(); // ✅ stable identity

  db.prepare("DELETE FROM user_profile").run();
  db.prepare(
    `INSERT INTO user_profile (user_id, name, avatar_path, created_at)
     VALUES (?, ?, ?, ?)`
  ).run(userId, name, fileName, Date.now());

  return true;
});
