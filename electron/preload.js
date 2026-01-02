const { contextBridge, ipcRenderer, shell } = require("electron");

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
  openEmoji: () => ipcRenderer.invoke("emoji:open"),
  openExternal: (url) => shell.openExternal(url),
  readAvatar: (avatarPath) => ipcRenderer.invoke("avatar:read", avatarPath),
  sendAvatar: async () => {
    return ipcRenderer.invoke("avatar:send");
  },
  saveAvatar: (userId, avatarHash, avatarBase64) =>
  ipcRenderer.invoke("avatar:save", {
    userId,
    avatarHash,
    avatarBase64
  }),
});
