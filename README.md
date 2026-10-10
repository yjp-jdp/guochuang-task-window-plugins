# 国创任务小窗 · DSH / Z.Code 插件

只装任务小窗，不装另一套 Harness。不替换品牌、模型、会话或宿主设置。

**Windows x64 测试版 0.1.0。** 两个插件各自附带独立 Electron 小窗，启动后可离开宿主继续专注。并非 DSH/Z.Code 原生扩展窗口 API；不修改宿主。插件安装是否已在真实宿主通过，请看 [验证报告](docs/validation.md)，不要将契约测试当成真实安装验证。

## 功能

- 自己创建、编辑任务，选择截止日期时间，完成/恢复。
- 任务优先显示、紧急标记；滚轮在当前任务区切换任务。
- **窗口置顶**与**任务优先显示**是两个不同按钮。
- 专注正计时，暂停后记录可选备注，历史可滚动、复制。
- 45 分钟提示休息，不自动弹出小窗。
- 本地持久化、手动 JSON 导出。默认空清单，不夹带示例任务。

不包含整个 LifePilot。首版不包含飞书、Obsidian、手机同步和自动执行，不假装已经接通。

## DSH

解压 `task-window-dsh-win-x64.zip`。包中 `plugin/` 为完整插件（包括 native）；单独发布的 `plugin.tgz` 为同内容的 npm 安装包。
已验证的 CLI 用法：`dsh plugin --profile web add "完整路径/plugin.tgz"`，随后重启对应 profile。桌面版是否提供本地包安装入口以其版本为准，不能用 CLI 改写专属 desktop profile；不要替换官方 profile 或品牌插件。安装后侧栏底部出现 **任务小窗**，点击打开。详见验证报告的宿主版本限制。

未安装宿主前也可以双击 `plugin/native/TaskWindow.exe` 查看组件（默认 Z.Code 数据目录）；通过 DSH 入口打开时使用独立 DSH 数据目录。

## Z.Code

解压 `task-window-zcode-win-x64.zip`，在 Z.Code 插件管理中添加本地 `plugin/` 目录，启用技能、命令和 MCP。执行 `/task-window` 或明确要求“打开任务小窗”。MCP `open_task_window` 只打开窗口，不替你完成任务。MCP 需要 Node.js 可执行程序在 PATH；缺少 Node 时可手动打开 `plugin/native/TaskWindow.exe`。

仓库 `marketplace.json` 是开发用索引：源码不包含原生运行时，不能只安装 Git 源码便运行；请使用完整发布包或先构建。尚未申请市场收录。

## 数据和卸载

数据分别位于 `%APPDATA%/guochuang-task-window/dsh/state.json` 与 `.../zcode/state.json`，不共享或导入现有 LifePilot 任务。卸载插件不主动删除任务；卸载前可以导出备份。未置顶时切到其他应用会收起，再点入口重新打开；置顶时保持在其他应用上方。计时不会因收起停止。

## 源码构建

Node.js 24、Windows x64：`npm install` → `npm test` → `npm run build`。构建使用独立 Electron 运行时，没有任何宿主源码依赖。也可通过 `TASK_WINDOW_ELECTRON_DIST` 指定已经下载的 Electron dist。`TASK_WINDOW_BUILD_DIR` 指定构建输出目录，默认 dist；发布源代码不含任何用户数据。`npm run test:ui` 使用 `TASK_WINDOW_QA_EXE` 指定构建的 TaskWindow.exe。

源码 MIT。Electron 和宿主接口来源见 [第三方声明](THIRD_PARTY.md)。预览包未代码签名，尚未申请任何官方插件市场收录。
