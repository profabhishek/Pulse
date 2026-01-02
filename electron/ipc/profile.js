const { ipcMain, dialog, app } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const db = require("../db");

function hashFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}


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

  const ext = path.extname(sourcePath) || ".png";

  const tempBuffer = fs.readFileSync(sourcePath);
  const avatarHash = crypto.createHash("sha256").update(tempBuffer).digest("hex");

  const fileName = `${avatarHash}.png`;

  const avatarsDir = path.join(app.getPath("userData"), "avatars");
  fs.mkdirSync(avatarsDir, { recursive: true });

  const destPath = path.join(avatarsDir, fileName);

  // only copy if not already exists
  if (!fs.existsSync(destPath)) {
    fs.writeFileSync(destPath, tempBuffer);
  }
  return fileName;
});

  ipcMain.handle("profile:save", async (_, { name, avatarPath }) => {
    if (!name) throw new Error("Name is required");
    if (!avatarPath) throw new Error("Avatar is required");

    const avatarsDir = path.join(app.getPath("userData"), "avatars");
    fs.mkdirSync(avatarsDir, { recursive: true });

    const finalFileName = avatarPath; // <hash>.png
    const avatarFullPath = path.join(avatarsDir, finalFileName);

    if (!fs.existsSync(avatarFullPath)) {
      throw new Error("Avatar file not found");
    }

    const userId = "u_" + Date.now();
    const avatarHash = hashFile(avatarFullPath);

    db.prepare("DELETE FROM user_profile").run();

    db.prepare(
      `INSERT INTO user_profile (user_id, name, avatar_path, avatar_hash, created_at)
      VALUES (?, ?, ?, ?, ?)`
    ).run(userId, name, finalFileName, avatarHash, Date.now());

    return true;
  });


ipcMain.handle("avatar:send", async () => {
  const profile = db.prepare(
    "SELECT avatar_path, avatar_hash FROM user_profile LIMIT 1"
  ).get();

  if (!profile) return null;

  const avatarPath = path.join(
    app.getPath("userData"),
    "avatars",
    profile.avatar_path
  );

  if (!fs.existsSync(avatarPath)) return null;

  const buffer = fs.readFileSync(avatarPath);
  const base64 = `data:image/png;base64,${buffer.toString("base64")}`;

  return {
    avatarHash: profile.avatar_hash,
    avatarBase64: base64
  };
});

ipcMain.handle(
  "avatar:save",
  async (_, { userId, avatarHash, avatarBase64 }) => {
    if (!userId || !avatarHash || !avatarBase64) return false;

    const avatarsDir = path.join(app.getPath("userData"), "avatars");
    fs.mkdirSync(avatarsDir, { recursive: true });

    const filePath = path.join(avatarsDir, `${avatarHash}.png`);

    // already cached → do nothing
    if (fs.existsSync(filePath)) {
      return true;
    }

    const base64Data = avatarBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    fs.writeFileSync(filePath, buffer);

    // update avatar_cache table
    db.prepare(
      `
      INSERT OR REPLACE INTO avatar_cache
      (user_id, avatar_hash, file_path, updated_at)
      VALUES (?, ?, ?, ?)
    `
    ).run(userId, avatarHash, filePath, Date.now());

    return true;
  }
);
