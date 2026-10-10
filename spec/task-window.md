# 两个宿主适配器，共用任务小窗

只有两个插件：DSH 包通过公开 sidebar.footer.action slot 提供打开入口；Z.Code 包通过技能、命令和 MCP 打开工具提供入口。DSH 不支持直接调用 Electron 原生窗口 API，因此两个包均附带独立 Electron 小窗组件，不包含宿主源码或 LifePilot 工程。禁止 patch 宿主。

窗口 Main 持有窗口 pinned/expanded 状态，默认非置顶；renderer 只呈现 IPC 返回。仅主动打开显示，非置顶失焦收起；置顶后失焦保持可见。单实例按宿主和数据目录隔离。

任务、专注、备注由单个 Main store 持有，所有命令串行 → 校验 → 生成新状态 → 临时文件落盘并原子重命名 → 接受新状态 → 返回 projection。保存失败不更新 UI 或内存。数据位于 userData/task-window-dsh、task-window-zcode；不读取 LifePilot、.zcode 或 DSH 的私人数据。加载失败明确报错，不静默清空数据。

待办可创建/编辑/完成/恢复；pin 是任务优先级，window-pin 是窗口置顶，分开命名。日期时间由 datetime-local 选择，可不填。正计时只能同时绑定一个任务；暂停可写可选备注，记录后关闭本轮，历史记录可滚动与复制。取消编辑不丢 draft、不自动提交。45 分钟显示休息提示，不自动重开小窗。导出 JSON 用原生保存对话框；完成计时仍保留历史。

发布：源码 MIT，Electron 独立上游第三方声明；不将上游应用说成原创。两份 Windows zip + DSH tgz + Z.Code marketplace manifest；GitHub 不含用户状态、账号、API 密钥、个人任务或原工程 node_modules。兼容性结论区分契约/模拟验证和真实宿主安装验证。
