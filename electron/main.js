const { app, BrowserWindow, protocol, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
Menu.setApplicationMenu(null)
// 🔥 Register custom protocol BEFORE app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: "pulse-avatar",
    privileges: {
      secure: true,
      standard: true
    }
  }
]);

// 🔥 Register IPC handlers
require("./ipc/profile");

console.log(__dirname)

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "assets/icons/app.ico"),
    backgroundColor: "#313338",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true
    }
  });

  // Load Vite dev server
  mainWindow.loadURL("http://localhost:5173");
}

app.whenReady().then(() => {
  // 🔥 Handle pulse-avatar:// protocol
  protocol.registerFileProtocol("pulse-avatar", (request, callback) => {
  const fileName = request.url
    .replace("pulse-avatar://", "")
    .replace(/\/+$/, ""); // 🔥 strip trailing slash

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
