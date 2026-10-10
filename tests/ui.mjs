import assert from "node:assert/strict";
import { _electron } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const exe = process.env.TASK_WINDOW_QA_EXE;
if (!exe) throw Error("Set TASK_WINDOW_QA_EXE");
const out = resolve(
  process.env.TASK_WINDOW_QA_OUTPUT || "output/ui-" + Date.now(),
);
await mkdir(out, { recursive: true });
const data = resolve(out, "user-data");
const launch = () =>
  _electron.launch({
    executablePath: exe,
    args: ["--host=dsh", "--disable-gpu"],
    env: { ...process.env, TASK_WINDOW_TEST_DATA: data },
  });
let app = await launch();
try {
  const p = await app.firstWindow();
  p.setDefaultTimeout(12000);
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.waitForFunction(() => window.taskWindow);
  await p.locator("#expand").click();
  await p.locator("#newTask").click();
  await p.locator("#taskTitle").fill("保留未提交的草稿");
  await p.locator("#cancelEdit").click();
  await p.locator("#newTask").click();
  assert.equal(await p.locator("#taskTitle").inputValue(), "保留未提交的草稿");
  await p.locator("#taskTitle").fill("完成插件发布前的交互验证");
  await p.locator("#taskDue").fill("2026-10-11T18:00");
  await p.locator("#editor button[type=submit]").click();
  await p.locator("#newTask").click();
  await p.locator("#taskTitle").fill("整理今日专注记录");
  await p.locator("#editor button[type=submit]").click();
  await p.waitForFunction(
    () => document.querySelectorAll(".task-row").length === 2,
  );
  await p.locator("#windowPin").click();
  assert.equal(
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].isAlwaysOnTop(),
    ),
    true,
  );
  await p.locator("#expand").click();
  await p.waitForFunction(() => innerHeight === 268);
  await p.screenshot({ path: resolve(out, "dsh-compact.png") });
  const before = await p.locator("#title").textContent();
  await p.locator("#title").hover();
  await p.mouse.wheel(0, 120);
  await p.waitForTimeout(220);
  assert.notEqual(await p.locator("#title").textContent(), before);
  await p.locator(".current").focus();
  await p.keyboard.press("ArrowDown");
  assert.equal(await p.locator("#title").textContent(), before);
  await p.keyboard.press("ArrowUp");
  await p.locator("#priority").click();
  await p.locator("#urgent").click();
  await p.locator("#timer").click();
  await p.waitForTimeout(1100);
  await p.locator("#timer").click();
  await p.waitForFunction(
    () => document.getElementById("timer").textContent === "继续",
  );
  await p.locator("#record").click();
  await p.locator("#note").fill("完成窗口置顶、任务切换和暂停后的输入验证。");
  await p.mouse.move(2, 2);
  await p.waitForTimeout(1200);
  assert.equal(
    await p.locator("#note").inputValue(),
    "完成窗口置顶、任务切换和暂停后的输入验证。",
  );
  await p.locator("#noteEditor button[type=submit]").click();
  await p.locator(".record-row").waitFor();
  await p.screenshot({ path: resolve(out, "dsh-expanded.png") });
  await p.locator("#complete").click();
  await p.locator(".task-row.done").waitFor();
  assert.equal(await p.locator(".record-row").count(), 1);
  await p.locator("#timer").click();
  await p.waitForFunction(
    () => document.getElementById("timer").textContent === "暂停",
  );
  await p.locator("#complete").click();
  await p.waitForFunction(() => document.getElementById("timer").disabled);
  assert.equal(await p.locator("#timer").textContent(), "请先记录");
  await p.locator("#record").click();
  await p.locator("#noteEditor button[type=submit]").click();
  await p.waitForFunction(
    () => document.querySelectorAll(".record-row").length === 2,
  );
  await p
    .locator(".task-row button")
    .filter({ hasText: "恢复" })
    .first()
    .click();
  await p.waitForFunction(() => !document.getElementById("timer").disabled);
  await p.locator("#timer").click();
  await p.waitForFunction(
    () => document.getElementById("timer").textContent === "暂停",
  );
  await p.locator("#timer").click();
  await p.waitForFunction(
    () => document.getElementById("timer").textContent === "继续",
  );
  await p.locator("#windowPin").click();
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].emit("blur"),
  );
  assert.equal(
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].isVisible(),
    ),
    false,
  );
  await p.waitForTimeout(1200);
  assert.equal(
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].isVisible(),
    ),
    false,
  );
  assert.deepEqual(errors, []);
  await app.close();
  app = await launch();
  const next = await app.firstWindow();
  await next.locator("#expand").click();
  assert.equal(await next.locator(".task-row").count(), 2);
  assert.equal(await next.locator(".record-row").count(), 2);
  console.log(
    "PASS task create/date, wheel, task priority/urgent, real native pin, pause→note→save, completion, restart persistence. " +
      out,
  );
} finally {
  await app.close();
}
