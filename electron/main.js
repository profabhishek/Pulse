const { app, BrowserWindow, protocol, Menu, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { dialog } = require("electron");
const mime = require("mime-types");

// 🔥 FORCE LOAD IPC HANDLERS (ASAR-SAFE)
require(path.join(__dirname, "ipc", "profile.js"));

let mainWindow;

function createWindow() {
  console.log("MAIN.JS LOADED");

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#313338",
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true
    }
  });

  const { shell } = require("electron");

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.openDevTools({ mode: "detach" });

  const isDev = !app.isPackaged;

  if (isDev) {
    console.log("Loading DEV URL");
    mainWindow.loadURL("http://localhost:5173");
  } else {
    const prodPath = path.join(__dirname, "renderer", "index.html");
    console.log("Loading PROD FILE:", prodPath);
    mainWindow.loadFile(prodPath);
  }

  // 🔥 LOG LOAD ISSUES
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("RENDERER LOADED SUCCESSFULLY");
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (_event, code, desc, url) => {
      console.error("FAILED TO LOAD:", code, desc, url);
    }
  );
}

app.whenReady().then(() => {
  // 🔥 CUSTOM PROTOCOL FOR AVATARS
  protocol.registerFileProtocol("pulse-avatar", (request, callback) => {
    try {
      const fileName = request.url
        .replace("pulse-avatar://", "")
        .replace(/\/+$/, "");

      const avatarPath = path.join(
        app.getPath("userData"),
        "avatars",
        fileName
      );

      if (!fs.existsSync(avatarPath)) {
        // tell chromium the file is missing (prevents crash spam)
        return callback({ error: -6 }); // FILE_NOT_FOUND
      }

      callback({ path: avatarPath });
    } catch (err) {
      console.error("pulse-avatar protocol error:", err);
      callback({ error: -2 }); // FAILED
    }
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});


ipcMain.on("window:minimize", () => {
  BrowserWindow.getFocusedWindow()?.minimize();
});

ipcMain.on("window:maximize", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;

  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

ipcMain.on("window:close", () => {
  BrowserWindow.getFocusedWindow()?.close();
});

ipcMain.handle("files:open", async () => {
  const result = await dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "Images", extensions: ["png", "jpg", "jpeg", "gif"] },
        { name: "Videos", extensions: ["mp4", "webm", "mov"] },
        { name: "PDF", extensions: ["pdf"] },
        { name: "All Files", extensions: ["*"] }
      ]
    }
  );

  if (result.canceled) return [];

  return result.filePaths.map((filePath) => {
    const buffer = fs.readFileSync(filePath);
    const type = mime.lookup(filePath) || "application/octet-stream";

    return {
      name: path.basename(filePath),
      mime: type,
      size: buffer.length,
      dataUrl: `data:${type};base64,${buffer.toString("base64")}`  // aise hi krna hai na
    };
  });
});

ipcMain.handle("emoji:open", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win?.webContents?.showEmojiPanel) {
    win.webContents.showEmojiPanel();
    return { native: true };
  }
  return { native: false };
});

ipcMain.handle("avatar:read", async (_event, avatarValue) => {
  try {
    if (!avatarValue) return null;

    let filePath = null;

    if (avatarValue.startsWith("pulse-avatar://")) {
      const fileName = avatarValue
        .replace("pulse-avatar://", "")
        .replace(/\/+$/, "");

      filePath = path.join(
        app.getPath("userData"),
        "avatars",
        fileName
      );
    } else {
      filePath = avatarValue;
    }

    if (!filePath || !fs.existsSync(filePath)) return null;

    const buffer = fs.readFileSync(filePath);
    const type = mime.lookup(filePath) || "application/octet-stream";

    return `data:${type};base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.error("avatar:read error:", err);
    return null;
  }
});
