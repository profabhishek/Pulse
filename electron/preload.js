const { contextBridge, ipcRenderer, } = require("electron");

contextBridge.exposeInMainWorld("pulse", {
  getProfile: () => ipcRenderer.invoke("profile:get"),
  saveProfile: (data) => ipcRenderer.invoke("profile:save", data),
  pickAvatar: () => ipcRenderer.invoke("profile:pickAvatar")
});


contextBridge.exposeInMainWorld("windowControls", {
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close")
});

contextBridge.exposeInMainWorld("electronAPI", {
  openFiles: () => ipcRenderer.invoke("files:open"),
  openEmoji: () => ipcRenderer.invoke("emoji:open")
});
