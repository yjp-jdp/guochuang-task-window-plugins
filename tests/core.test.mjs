import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const require = createRequire(import.meta.url),
  { empty, transition, duration } = require("../app/core.cjs"),
  { createStore } = require("../app/store.cjs");
test("create/edit/priority/done remain independent of native pin", () => {
  let s = transition(empty(), "create", { title: "自己的任务", due: "" }, 0);
  const id = s.tasks[0].id;
  s = transition(s, "task-pin", { id });
  assert.equal(s.tasks[0].pinned, true);
  s = transition(s, "urgent", { id });
  assert.equal(s.tasks[0].urgent, true);
  s = transition(s, "edit", { id, title: "修改", due: "2026-10-11T18:00" });
  assert.equal(s.tasks[0].title, "修改");
  s = transition(s, "done", { id });
  assert.equal(s.tasks[0].done, true);
  assert.throws(() => transition(s, "create", { title: "" }));
});
test("paused optional note, stale record protection, restart duration", () => {
  let s = transition(empty(), "create", { title: "任务" }, 0);
  const id = s.tasks[0].id;
  s = transition(s, "start", { id }, 1000);
  assert.equal(duration(s.focus, 2500), 1500);
  assert.throws(() => transition(s, "record", { focusId: s.focus.id }));
  s = transition(s, "pause", {}, 3000);
  assert.equal(duration(s.focus, 9000), 2000);
  assert.throws(() => transition(s, "record", { focusId: "stale" }));
  s = transition(
    s,
    "record",
    { focusId: s.focus.id, note: "完成一部分" },
    5000,
  );
  assert.equal(s.records[0].note, "完成一部分");
  assert.equal(s.records[0].duration, 2000);
  assert.equal(s.focus, null);
});
test("serial writes and corrupt data never silently overwritten", async () => {
  const dir = await mkdtemp(join(tmpdir(), "task-window-test-"));
  const file = join(dir, "state.json");
  const store = await createStore(file);
  await Promise.all([
    store.dispatch("create", { title: "1" }),
    store.dispatch("create", { title: "2" }),
  ]);
  assert.equal((await createStore(file)).get().tasks.length, 2);
  await writeFile(file, "not-json");
  await assert.rejects(createStore(file));
  assert.equal(await readFile(file, "utf8"), "not-json");
});
