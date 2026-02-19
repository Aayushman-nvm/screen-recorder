// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getSources: () => ipcRenderer.invoke("get-sources"),

  openSourcesMenu: (sources) =>
    ipcRenderer.invoke("show-sources-menu", sources),

  onSourceSelected: (callback) => {
    ipcRenderer.removeAllListeners("source-selected");
    ipcRenderer.on("source-selected", (_, source) => callback(source));
  },

  saveVideo: (arrayBuffer) => ipcRenderer.invoke("save-video", arrayBuffer),
});
