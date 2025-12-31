const { ipcMain, dialog, app } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const db = require("../db");

console.log("PROFILE IPC LOADED");

ipcMain.handle("profile:get", () => {
  return db.prepare("SELECT * FROM user_profile LIMIT 1").get() || null;
});

ipcMain.handle("profile:pickAvatar", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg"] }]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const sourcePath = result.filePaths[0];
  const ext = path.extname(sourcePath);
  const fileName = `${Date.now()}-${crypto.randomUUID()}${ext}`;

  const avatarsDir = path.join(app.getPath("userData"), "avatars");
  fs.mkdirSync(avatarsDir, { recursive: true });

  const destPath = path.join(avatarsDir, fileName);
  fs.copyFileSync(sourcePath, destPath);

  return fileName;
});

ipcMain.handle("profile:save", async (_, { name, avatarPath }) => {
  if (!name) throw new Error("Name is required");
  if (!avatarPath) throw new Error("Avatar is required");

  const avatarsDir = path.join(app.getPath("userData"), "avatars");
  fs.mkdirSync(avatarsDir, { recursive: true });

  let finalFileName = avatarPath;

  if (path.isAbsolute(avatarPath)) {
    const ext = path.extname(avatarPath) || ".png";
    finalFileName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    const destPath = path.join(avatarsDir, finalFileName);
    fs.copyFileSync(avatarPath, destPath);
  } else {
    const candidate = path.join(avatarsDir, avatarPath);
    if (!fs.existsSync(candidate)) {
      throw new Error("Avatar file not found");
    }
  }

  const userId = "u_" + Date.now();

  db.prepare("DELETE FROM user_profile").run();
  db.prepare(
    `INSERT INTO user_profile (user_id, name, avatar_path, created_at)
     VALUES (?, ?, ?, ?)`
  ).run(userId, name, finalFileName, Date.now());

  return true;
});