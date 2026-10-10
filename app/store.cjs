const fs = require("node:fs/promises");
const path = require("node:path");
const { empty, transition, validate } = require("./core.cjs");
async function createStore(file) {
  let state;
  try {
    state = validate(JSON.parse(await fs.readFile(file, "utf8")));
  } catch (e) {
    if (e.code === "ENOENT") state = empty();
    else throw e;
  }
  let queue = Promise.resolve();
  return {
    get: () => structuredClone(state),
    dispatch(command, input) {
      const result = queue.then(async () => {
        const next = transition(state, command, input);
        await fs.mkdir(path.dirname(file), { recursive: true });
        // 先落盘再接受状态，失败时保留旧任务，不用空文件覆盖损坏的数据。
        await fs.writeFile(
          file + ".tmp",
          JSON.stringify(next, null, 2),
          "utf8",
        );
        await fs.rename(file + ".tmp", file);
        state = next;
        return structuredClone(state);
      });
      queue = result.catch(() => {});
      return result;
    },
  };
}
module.exports = { createStore };
