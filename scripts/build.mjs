import { cp, mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
const require = createRequire(import.meta.url),
  root = resolve(import.meta.dirname, "..");
const out = process.env.TASK_WINDOW_BUILD_DIR
  ? resolve(process.env.TASK_WINDOW_BUILD_DIR)
  : join(root, "dist");
await mkdir(out, { recursive: true });
const electronDist = process.env.TASK_WINDOW_ELECTRON_DIST
  ? resolve(process.env.TASK_WINDOW_ELECTRON_DIST)
  : resolve(require.resolve("electron/package.json"), "../dist");
for (const host of ["dsh", "zcode"]) {
  const stage = join(out, host),
    plugin = join(stage, "plugin");
  await mkdir(plugin, { recursive: true });
  await cp(join(root, "adapters", host), plugin, { recursive: true });
  const native = join(plugin, "native");
  await cp(electronDist, native, { recursive: true });
  await rename(join(native, "electron.exe"), join(native, "TaskWindow.exe"));
  await cp(join(root, "app"), join(native, "resources", "app"), {
    recursive: true,
  });
  for (const name of ["README.md", "LICENSE", "THIRD_PARTY.md"])
    await cp(join(root, name), join(plugin, name));
  await cp(join(root, "docs"), join(plugin, "docs"), { recursive: true });
  // npm 包只包含适配器与它的独立小窗；源代码仓库不提交运行时二进制。
  if (host === "dsh") {
    const result = execFileSync(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["pack", "--json", "--pack-destination", stage],
      { cwd: plugin, encoding: "utf8", shell: process.platform === "win32" },
    );
    const item = JSON.parse(result)[0];
    await rename(join(stage, item.filename), join(stage, "plugin.tgz"));
  }
  await writeFile(
    join(stage, "PACKAGE-CONTENTS.md"),
    `国创任务小窗 ${host.toUpperCase()} 0.1.0\n只包含 plugin/ 与插件原生小窗组件；不包含宿主或用户数据。\n`,
  );
  const zip = join(out, `task-window-${host}-win-x64.zip`);
  if (process.platform === "win32")
    execFileSync(
      "tar.exe",
      ["-a", "-c", "-f", zip, "-C", stage, "plugin", "PACKAGE-CONTENTS.md"],
      { stdio: "inherit" },
    );
  console.log("Built " + zip);
}
await writeFile(
  join(out, "build-info.json"),
  JSON.stringify(
    {
      version: "0.1.0",
      electron: (await readFile(join(electronDist, "version"), "utf8")).trim(),
      hosts: ["dsh", "zcode"],
    },
    null,
    2,
  ),
);
