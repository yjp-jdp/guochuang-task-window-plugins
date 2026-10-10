const { app, BrowserWindow, ipcMain, screen, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const { createStore } = require("./store.cjs");
const host = process.argv.includes("--host=dsh") ? "dsh" : "zcode";
const custom = process.env.TASK_WINDOW_TEST_DATA;
app.setName("国创任务小窗 " + host.toUpperCase());
app.setPath(
  "userData",
  custom || path.join(app.getPath("appData"), "guochuang-task-window", host),
);
let win,
  store,
  pinned = false,
  expanded = false,
  dialogOpen = false;
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    if (win) {
      win.show();
      win.focus();
    }
  });
  app
    .whenReady()
    .then(async () => {
      try {
        store = await createStore(
          path.join(app.getPath("userData"), "state.json"),
        );
      } catch (e) {
        dialog.showErrorBox(
          "任务数据无法加载",
          e.message + "\n没有清空或覆盖原数据。",
        );
        app.quit();
        return;
      }
      const area = screen.getPrimaryDisplay().workArea;
      win = new BrowserWindow({
        width: 340,
        height: 268,
        x: area.x + area.width - 356,
        y: area.y + 50,
        show: false,
        frame: false,
        resizable: false,
        alwaysOnTop: false,
        backgroundColor: "#ffffff",
        webPreferences: {
          preload: path.join(__dirname, "preload.cjs"),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
        },
      });
      win.on("blur", () => {
        if (!pinned && !dialogOpen) win.hide();
      });
      win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
      win.webContents.on("will-navigate", (e) => e.preventDefault());
      win.once("ready-to-show", () => win.show());
      ipcMain.handle("task-window", async (event, command, input = {}) => {
        if (
          event.sender !== win.webContents ||
          event.senderFrame !== win.webContents.mainFrame
        )
          throw Error("不受信任的窗口");
        if (command === "state") return snapshot();
        if (command === "window-pin") {
          pinned = !pinned;
          win.setAlwaysOnTop(pinned);
          return snapshot();
        }
        if (command === "expand") {
          expanded = !expanded;
          resize();
          return snapshot();
        }
        if (command === "hide") {
          win.hide();
          return snapshot();
        }
        if (command === "export") {
          dialogOpen = true;
          try {
            const result = await dialog.showSaveDialog(win, {
              defaultPath: "任务小窗备份.json",
              filters: [{ name: "JSON", extensions: ["json"] }],
            });
            if (!result.canceled) {
              await fs.writeFile(
                result.filePath,
                JSON.stringify(store.get(), null, 2),
                "utf8",
              );
            }
            return snapshot();
          } finally {
            dialogOpen = false;
          }
        }
        await store.dispatch(command, input);
        return snapshot();
      });
      await win.loadFile(path.join(__dirname, "index.html"));
    })
    .catch((e) => {
      dialog.showErrorBox("任务小窗启动失败", e.message);
      app.quit();
    });
  app.on("window-all-closed", () => app.quit());
}
function snapshot() {
  return { host, pinned, expanded, data: store.get() };
}
function resize() {
  const area = screen.getDisplayMatching(win.getBounds()).workArea;
  const b = win.getBounds();
  const width = expanded ? 420 : 340,
    height = expanded ? Math.min(680, area.height - 32) : 268;
  win.setBounds({
    x: Math.max(area.x, Math.min(b.x, area.x + area.width - width)),
    y: Math.max(area.y, Math.min(b.y, area.y + area.height - height)),
    width,
    height,
  });
}
