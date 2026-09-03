import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ELECTRON_COLORS, ELECTRON_WINDOW } from "./constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appIconPath = path.join(__dirname, "../build/icon.png");

const registerAppIpcHandlers = (): void => {
  ipcMain.handle("app:get-version", () => app.getVersion());
  ipcMain.handle("app:open-external", async (_event, url: string): Promise<boolean> => {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      throw new Error("Only HTTP(S) URLs can be opened externally.");
    }

    await shell.openExternal(parsedUrl.toString());

    return true;
  });
};

const createMainWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: ELECTRON_WINDOW.WIDTH,
    height: ELECTRON_WINDOW.HEIGHT,
    minWidth: ELECTRON_WINDOW.MIN_WIDTH,
    minHeight: ELECTRON_WINDOW.MIN_HEIGHT,
    title: ELECTRON_WINDOW.TITLE,
    icon: appIconPath,
    backgroundColor: ELECTRON_COLORS.BACKGROUND,
    webPreferences: {
      preload: path.join(__dirname, "../electron/preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    return;
  }

  const devServerUrl = process.env.VITE_DEV_SERVER_URL ?? "http://127.0.0.1:5173";
  mainWindow.webContents.once("did-finish-load", () => {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  });
  mainWindow.loadURL(devServerUrl);
};

app.whenReady().then(() => {
  registerAppIpcHandlers();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
