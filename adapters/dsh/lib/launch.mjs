import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
export async function launchNative(host) {
  if (process.platform !== "win32")
    throw Error("此测试包支持 Windows x64，其他平台尚未发布。");
  const executable = fileURLToPath(
    new URL("../native/TaskWindow.exe", import.meta.url),
  );
  await access(executable);
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.TASK_WINDOW_TEST_DATA;
  return new Promise((resolve, reject) => {
    const child = spawn(executable, [`--host=${host}`], {
      env,
      stdio: "ignore",
      detached: true,
      windowsHide: true,
    });
    child.once("error", reject);
    child.once("spawn", () => {
      child.unref();
      resolve({ pid: child.pid });
    });
  });
}
