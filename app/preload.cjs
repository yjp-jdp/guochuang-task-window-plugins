const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("taskWindow", {
  command: (command, input) =>
    ipcRenderer.invoke("task-window", command, input),
});
