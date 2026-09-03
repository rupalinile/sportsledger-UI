import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("crickTrack", {
  platform: process.platform
});
