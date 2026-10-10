window.__ModuleLoader__.load({
  id: "@guochuang/task-window-dsh",
  factory: (require) => {
    const { jsx, jsxs } = require("react/jsx-runtime");
    const { useState } = require("react");
    function Launcher() {
      const [busy, setBusy] = useState(false),
        [error, setError] = useState("");
      async function open() {
        setBusy(true);
        setError("");
        try {
          const r = await fetch("/guochuang-task-window/open", {
            method: "POST",
          });
          const data = await r.json();
          if (!r.ok || !data.ok) throw Error(data.error || "打开失败");
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }
      return jsxs("div", {
        style: { padding: "4px 8px" },
        children: [
          jsx("button", {
            type: "button",
            disabled: busy,
            onClick: open,
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "8px 10px",
              border: "1px solid #e2e7ef",
              borderRadius: 8,
              background: "#fff",
              color: "#182333",
              font: "inherit",
              cursor: "pointer",
            },
            children: busy ? "正在打开…" : "任务小窗",
          }),
          error &&
            jsx("p", {
              role: "alert",
              style: { fontSize: 12, color: "#a32738" },
              children: error,
            }),
        ],
      });
    }
    return {
      inject: ["slots"],
      apply(ctx) {
        ctx.slots.inject("sidebar.footer.action", function* () {
          yield ctx.slots.register(
            {
              name: "sidebar.footer.action",
              id: "guochuang-task-window",
              order: 30,
              label: "任务小窗",
            },
            Launcher,
          );
        });
      },
    };
  },
});
