const { contextBridge, ipcRenderer } = require("electron");

const sportsLedgerApi = {
  getVersion: () => ipcRenderer.invoke("app:get-version"),
  openExternal: (url) => ipcRenderer.invoke("app:open-external", url)
};

contextBridge.exposeInMainWorld("crickTrack", {
  platform: process.platform,
  getVersion: sportsLedgerApi.getVersion,
  openExternal: sportsLedgerApi.openExternal
});

contextBridge.exposeInMainWorld("sportsLedger", sportsLedgerApi);
