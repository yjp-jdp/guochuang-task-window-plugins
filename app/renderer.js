const $ = (id) => document.getElementById(id);
let state,
  selected = null,
  editId = null,
  noteFocusId = null,
  wheelAt = 0;
const drafts = new Map();
function openTasks() {
  return state.data.tasks
    .filter((t) => !t.done)
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        Number(b.urgent) - Number(a.urgent) ||
        b.createdAt - a.createdAt,
    );
}
function current() {
  const list = openTasks();
  return list.find((t) => t.id === selected) || list[0];
}
function elapsed() {
  const f = state.data.focus;
  return f
    ? f.elapsed +
        (f.startedAt === null ? 0 : Math.max(0, Date.now() - f.startedAt))
    : 0;
}
function time(ms) {
  const n = Math.floor(ms / 1000);
  return `${Math.floor(n / 60)
    .toString()
    .padStart(2, "0")}:${(n % 60).toString().padStart(2, "0")}`;
}
function due(t) {
  return t.due
    ? new Date(t.due).toLocaleString("zh-CN", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "未设截止时间";
}
async function send(command, input) {
  try {
    const next = await window.taskWindow.command(command, input);
    state = next;
    $("error").hidden = true;
    render();
    return true;
  } catch (e) {
    $("error").textContent = e.message;
    $("error").hidden = false;
    return false;
  }
}
function button(label, action) {
  const b = document.createElement("button");
  b.textContent = label;
  b.addEventListener("click", action);
  return b;
}
function render() {
  $("host").textContent =
    `${state.host.toUpperCase()} 插件 · ${openTasks().length} 项待办`;
  $("windowPin").textContent = state.pinned ? "已置顶" : "置顶";
  $("windowPin").setAttribute("aria-pressed", String(state.pinned));
  $("workspace").hidden = !state.expanded;
  $("expand").textContent = state.expanded ? "收起列表" : "全部任务";
  const t = current(),
    list = openTasks();
  $("position").textContent = t
    ? `下一件事 · ${list.indexOf(t) + 1}/${list.length} · 滚轮切换`
    : "今天做什么";
  $("title").textContent = t?.title || "添加一件今天想做的事";
  $("meta").textContent = t
    ? `${due(t)}${t.urgent ? " · 紧急" : ""}`
    : "点击「全部任务」，开始自己的任务清单";
  for (const id of ["priority", "urgent", "complete"]) $(id).disabled = !t;
  $("priority").textContent = t?.pinned ? "优先显示中" : "优先显示";
  $("priority").setAttribute("aria-pressed", String(Boolean(t?.pinned)));
  $("urgent").setAttribute("aria-pressed", String(Boolean(t?.urgent)));
  $("count").textContent = `${state.data.tasks.length} 项`;
  const rows = state.data.tasks.map((task) => {
    const row = document.createElement("div");
    row.className = "task-row" + (task.done ? " done" : "");
    const copy = document.createElement("div");
    copy.className = "task-copy";
    const title = document.createElement("strong");
    title.textContent = task.title;
    const meta = document.createElement("small");
    meta.textContent = `${due(task)}${task.pinned ? " · 优先" : ""}${task.urgent ? " · 紧急" : ""}`;
    copy.append(title, meta);
    row.append(
      copy,
      button("编辑", () => openEditor(task)),
      button(task.done ? "恢复" : "完成", () => send("done", { id: task.id })),
    );
    return row;
  });
  $("taskList").replaceChildren(...rows);
  if (!rows.length) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "没有示例任务，你添加的任务才会出现在这里。";
    $("taskList").append(p);
  }
  const records = state.data.records.map((r) => {
    const row = document.createElement("article");
    row.className = "record-row";
    const meta = document.createElement("small");
    const date = document.createElement("span");
    date.textContent = new Date(r.at).toLocaleString("zh-CN");
    const d = document.createElement("span");
    d.textContent = time(r.duration);
    meta.append(date, d);
    const title = document.createElement("p");
    title.textContent =
      state.data.tasks.find((t) => t.id === r.taskId)?.title || "任务";
    const p = document.createElement("p");
    p.textContent = r.note || "未填写备注";
    row.append(meta, title, p);
    return row;
  });
  $("records").replaceChildren(...records);
  if (!records.length) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "记录专注后，时长和备注会保存在这里。";
    $("records").append(p);
  }
  clock();
}
function clock() {
  if (!state) return;
  const f = state.data.focus,
    t = current(),
    focused = state.data.tasks.find((t) => t.id === f?.taskId);
  $("clock").textContent = time(elapsed());
  $("timer").textContent = focused?.done
    ? "请先记录"
    : f
      ? f.startedAt === null
        ? "继续"
        : "暂停"
      : "开始";
  $("timer").disabled = Boolean(focused?.done) || (!t && !f);
  $("record").disabled = !f;
  const other = f && f.taskId !== t?.id;
  $("focusHint").textContent = focused?.done
    ? "任务已完成，可保存专注"
    : other
      ? `专注：${focused?.title || "任务"}`
      : f
        ? f.startedAt === null
          ? "已暂停"
          : "专注中"
        : "专注于下一件事";
  $("reminder").hidden = elapsed() < 45 * 60000;
}
async function ensureExpanded() {
  if (!state.expanded) return send("expand");
  return true;
}
async function openEditor(t) {
  if (!(await ensureExpanded())) return;
  if (!$("editor").hidden) rememberDraft();
  editId = t?.id || null;
  const draft = drafts.get(editId);
  $("editorTitle").textContent = t ? "编辑任务" : "添加任务";
  $("taskTitle").value = draft?.title ?? t?.title ?? "";
  $("taskDue").value = draft?.due ?? t?.due ?? "";
  $("editor").hidden = false;
  $("noteEditor").hidden = true;
  $("taskTitle").focus();
}
function rememberDraft() {
  drafts.set(editId, { title: $("taskTitle").value, due: $("taskDue").value });
}
$("newTask").onclick = () => openEditor();
$("cancelEdit").onclick = () => {
  rememberDraft();
  $("editor").hidden = true;
};
$("editor").onsubmit = async (e) => {
  e.preventDefault();
  if (
    await send(editId ? "edit" : "create", {
      id: editId,
      title: $("taskTitle").value,
      due: $("taskDue").value,
    })
  ) {
    drafts.delete(editId);
    $("editor").hidden = true;
  }
};
$("windowPin").onclick = () => send("window-pin");
$("hide").onclick = () => send("hide");
$("expand").onclick = () => send("expand");
$("priority").onclick = () => {
  const t = current();
  if (t) {
    selected = t.id;
    send("task-pin", { id: t.id });
  }
};
$("urgent").onclick = () => {
  const t = current();
  if (t) send("urgent", { id: t.id });
};
$("complete").onclick = async () => {
  const t = current();
  if (t && (await send("done", { id: t.id }))) {
    document.body.classList.remove("completed");
    void document.body.offsetWidth;
    document.body.classList.add("completed");
  }
};
$("timer").onclick = () => {
  const f = state.data.focus;
  if (f && f.startedAt !== null) send("pause");
  else send("start", { id: f?.taskId || current()?.id });
};
$("record").onclick = async () => {
  if (!state.data.focus) return;
  if (state.data.focus.startedAt !== null && !(await send("pause"))) return;
  if (!(await ensureExpanded())) return;
  noteFocusId = state.data.focus.id;
  $("noteEditor").hidden = false;
  $("editor").hidden = true;
  $("note").focus();
};
$("cancelNote").onclick = () => {
  $("noteEditor").hidden = true;
};
$("noteEditor").onsubmit = async (e) => {
  e.preventDefault();
  if (await send("record", { focusId: noteFocusId, note: $("note").value })) {
    $("noteEditor").hidden = true;
    $("note").value = "";
  }
};
$("export").onclick = () => send("export");
function changeTask(direction) {
  const list = openTasks();
  if (list.length < 2) return;
  const i = list.findIndex((t) => t.id === current()?.id);
  selected = list[(i + direction + list.length) % list.length].id;
  render();
}
const currentArea = document.querySelector(".current");
currentArea.tabIndex = 0;
currentArea.setAttribute("aria-label", "当前任务，使用上下方向键切换");
currentArea.addEventListener("keydown", (e) => {
  if (e.target === currentArea && ["ArrowDown", "ArrowUp"].includes(e.key)) {
    e.preventDefault();
    changeTask(e.key === "ArrowDown" ? 1 : -1);
  }
});
currentArea.addEventListener(
  "wheel",
  (e) => {
    if (openTasks().length < 2 || Date.now() - wheelAt < 180 || !e.deltaY)
      return;
    e.preventDefault();
    wheelAt = Date.now();
    changeTask(e.deltaY > 0 ? 1 : -1);
  },
  { passive: false },
);
setInterval(clock, 1000);
void send("state");
