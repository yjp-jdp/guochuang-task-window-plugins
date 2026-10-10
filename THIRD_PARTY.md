# 来源与第三方组件

此仓库是任务小窗及两个宿主适配器，不是 LifePilot、DSH Desktop 或 Z.Code 的复制品，也不宣称它们由本项目原创。

- Electron 43.4.0 是第三方桌面运行时，采用 MIT，包含 Chromium 等第三方组件。发布包 native 目录保留 Electron LICENSE、LICENSES.chromium.html。详见 https://github.com/electron/electron 。
- DSH 插件通过公开 Cordis、webServer 和 sidebar slots 接口集成。React 由宿主提供，本插件不分发整个 DSH 或修改其品牌。宿主来源 https://github.com/deepseek-ai/deepseek-harness 和 https://github.com/dataelement/dsh-desktop 。
- Z.Code 插件通过公开 plugin manifest、技能、命令和 MCP 机制集成，不修改 Z.Code 可执行文件。宿主来源 https://github.com/zai-org/ZCode 。
- Playwright 仅用于测试，不随插件运行时分发。

任务、小窗布局、计时、备注逻辑与适配器源码在本仓库。蓝白交互继承用户在前期任务小窗中明确提出的产品需求。
