import test from "node:test";
import assert from "node:assert/strict";
import { apply } from "../adapters/dsh/lib/index.js";
import { handle } from "../adapters/zcode/scripts/mcp.mjs";
test("DSH adapter adds only launch endpoint, no brand replacement", async () => {
  let route;
  apply({
    effect(fn) {
      fn();
    },
    webServer: {
      register(v) {
        route = v;
        return () => {};
      },
    },
  });
  assert.equal(route.path, "/guochuang-task-window");
  const res = {
    writeHead(n) {
      this.status = n;
      return this;
    },
    end() {},
  };
  await route.handler(
    { url: "/guochuang-task-window/open", method: "GET", headers: {} },
    res,
  );
  assert.equal(res.status, 405);
  await route.handler(
    {
      url: "/guochuang-task-window/open",
      method: "POST",
      headers: { host: "localhost", origin: "https://evil.test" },
    },
    res,
  );
  assert.equal(res.status, 403);
});
test("Z.Code MCP only launches when explicitly called", async () => {
  let calls = 0;
  const launch = async () => {
    calls++;
  };
  const list = await handle({ id: 1, method: "tools/list" }, launch);
  assert.equal(list.tools[0].name, "open_task_window");
  assert.equal(calls, 0);
  assert.equal(
    await handle({ method: "notifications/initialized" }, launch),
    undefined,
  );
  await handle(
    { id: 2, method: "tools/call", params: { name: "open_task_window" } },
    launch,
  );
  assert.equal(calls, 1);
});
