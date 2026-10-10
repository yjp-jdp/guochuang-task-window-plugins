import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
const child = spawn(process.execPath, ["adapters/zcode/scripts/mcp.mjs"], {
  stdio: ["pipe", "pipe", "pipe"],
});
let output = "";
child.stdout.on("data", (d) => (output += d));
child.stdin.end(
  JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2024-11-05" },
  }) +
    "\n" +
    JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }) +
    "\n",
);
await new Promise((resolve, reject) => {
  child.on("error", reject);
  child.on("exit", (c) =>
    c === 0 ? resolve() : reject(Error("MCP exit " + c)),
  );
});
const messages = output.trim().split("\n").map(JSON.parse);
assert.equal(messages[0].result.serverInfo.name, "guochuang-task-window");
assert.equal(messages[1].result.tools[0].name, "open_task_window");
console.log("PASS Z.Code MCP real stdio initialize/tools/list");
if (process.env.TASK_WINDOW_DSH_QA_URL) {
  const browser = await chromium.launch({
    executablePath:
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.TASK_WINDOW_DSH_QA_URL);
    await page
      .getByRole("button", { name: "任务小窗", exact: true })
      .waitFor({ timeout: 20000 });
    const response = await page.evaluate(async () => {
      const r = await fetch("/guochuang-task-window/open", { method: "POST" });
      return { status: r.status, body: await r.json() };
    });
    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    await page.screenshot({
      path: "D:/LifePilot-builds/task-window-qa-20261010-b/dsh-host.png",
      fullPage: true,
    });
    console.log("PASS DSH installed client entry and live native launch route");
    console.log("Page errors: " + JSON.stringify(errors));
  } finally {
    await browser.close();
  }
}
