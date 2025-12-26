const { app, BrowserWindow, protocol, Menu, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

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

  // 🔥 REMOVE DEFAULT MENU
  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);

  // 🔥 FORCE DEVTOOLS (TEMPORARY – REMOVE LATER)
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
    const fileName = request.url
      .replace("pulse-avatar://", "")
      .replace(/\/+$/, "");

    const avatarPath = path.join(
      app.getPath("userData"),
      "avatars",
      fileName
    );

    callback({ path: avatarPath });
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
