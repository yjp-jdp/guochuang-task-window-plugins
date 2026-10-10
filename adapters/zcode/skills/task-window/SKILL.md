---
name: task-window
description: Open the user's standalone Guochuang task window when explicitly asked to open or manage their task mini-window.
---

用户要求打开任务小窗时调用 task-window MCP 的 open_task_window 工具。工具不可用时执行本插件根目录下 scripts/open.mjs（使用 Node）。不要下载程序，不要修改宿主文件，不要自动读取或迁移 LifePilot 的任务。打开后任务创建、计时、备注由用户在小窗操作；不要声称任务已创建或已完成。仅在用户请求时打开，不因普通对话自行打开。
