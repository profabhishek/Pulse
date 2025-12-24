const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pulse", {
  getProfile: () => ipcRenderer.invoke("profile:get"),
  saveProfile: (data) => ipcRenderer.invoke("profile:save", data),
  pickAvatar: () => ipcRenderer.invoke("profile:pickAvatar")
});
