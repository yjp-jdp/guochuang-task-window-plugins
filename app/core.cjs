const { randomUUID } = require("node:crypto");
const empty = () => ({ version: 1, tasks: [], focus: null, records: [] });
function text(value, max = 500) {
  if (typeof value !== "string") throw Error("请输入文字");
  return value.trim().slice(0, max);
}
function duration(f, now = Date.now()) {
  return f
    ? f.elapsed + (f.startedAt === null ? 0 : Math.max(0, now - f.startedAt))
    : 0;
}
function transition(source, command, input = {}, now = Date.now()) {
  const s = structuredClone(source);
  const task = () => {
    const t = s.tasks.find((t) => t.id === input.id);
    if (!t) throw Error("任务不存在");
    return t;
  };
  if (command === "create" || command === "edit") {
    const title = text(input.title);
    if (!title) throw Error("请填写任务名称");
    const due = input.due ? text(input.due, 32) : "";
    if (due && !Number.isFinite(Date.parse(due)))
      throw Error("请选择有效日期时间");
    if (command === "create")
      s.tasks.unshift({
        id: randomUUID(),
        title,
        due,
        done: false,
        pinned: false,
        urgent: false,
        createdAt: now,
      });
    else Object.assign(task(), { title, due });
  } else if (["done", "task-pin", "urgent"].includes(command)) {
    const t = task();
    const key = { done: "done", "task-pin": "pinned", urgent: "urgent" }[
      command
    ];
    t[key] = !t[key];
    if (command === "done" && t.done && s.focus?.taskId === t.id) {
      s.focus.elapsed = duration(s.focus, now);
      s.focus.startedAt = null;
    }
  } else if (command === "start") {
    const t = task();
    if (t.done) throw Error("已完成任务不能开始计时");
    if (s.focus && s.focus.taskId !== t.id)
      throw Error("请先记录当前专注，再开始其他任务");
    if (!s.focus)
      s.focus = { id: randomUUID(), taskId: t.id, elapsed: 0, startedAt: now };
    else if (s.focus.startedAt === null) s.focus.startedAt = now;
  } else if (command === "pause") {
    if (!s.focus) throw Error("当前没有专注计时");
    s.focus.elapsed = duration(s.focus, now);
    s.focus.startedAt = null;
  } else if (command === "record") {
    if (!s.focus) throw Error("当前没有可记录的专注");
    if (input.focusId !== s.focus.id) throw Error("计时已变化，请重新打开记录");
    if (s.focus.startedAt !== null) throw Error("请先暂停，再记录");
    s.records.unshift({
      id: randomUUID(),
      taskId: s.focus.taskId,
      duration: s.focus.elapsed,
      note: text(input.note ?? "", 4000),
      at: now,
    });
    s.focus = null;
  } else throw Error("未知任务操作");
  return s;
}
function validate(s) {
  if (
    !s ||
    s.version !== 1 ||
    !Array.isArray(s.tasks) ||
    !Array.isArray(s.records)
  )
    throw Error("任务数据格式不正确，请保留文件并联系维护者");
  if (
    s.tasks.some(
      (t) => typeof t.id !== "string" || typeof t.title !== "string",
    ) ||
    s.records.some(
      (r) => typeof r.taskId !== "string" || !Number.isFinite(r.duration),
    )
  )
    throw Error("任务数据校验失败");
  if (
    s.focus &&
    (!Number.isFinite(s.focus.elapsed) ||
      s.focus.elapsed < 0 ||
      !(s.focus.startedAt === null || Number.isFinite(s.focus.startedAt)) ||
      !s.tasks.some((t) => t.id === s.focus.taskId))
  )
    throw Error("专注数据校验失败");
  return s;
}
module.exports = { empty, duration, transition, validate };
