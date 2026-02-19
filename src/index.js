const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  desktopCapturer,
} = require("electron");
const path = require("node:path");
const fs = require("fs");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// ---------------- MENU ----------------
ipcMain.handle("show-sources-menu", async (event, sources) => {
  const template = sources.map((source) => ({
    label: source.name,
    click: () => {
      mainWindow.webContents.send("source-selected", source);
    },
  }));

  const menu = Menu.buildFromTemplate(template);
  menu.popup();
});

// ---------------- SAVE VIDEO ----------------
ipcMain.handle("save-video", async (event, arrayBuffer) => {
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save video",
    defaultPath: `recording-${Date.now()}.webm`,
  });

  if (!filePath) return;

  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filePath, buffer);

  return true;
});

// ---------------- CAPTURE ----------------
ipcMain.handle("get-sources", async () => {
  const sources = await desktopCapturer.getSources({
    types: ["window", "screen"],
    thumbnailSize: { width: 0, height: 0 },
  });
  return sources;
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
