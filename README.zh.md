# Computer Browser Use

## rc.5 已记录交付状态（2026-10-09）

冻结的 rc.5 归档已于2026-10-07安装到 macOS Intel；2026-10-08配套 Desktop 更新后，十个包文件仍与归档完全一致，Loader及客户端检查通过。后续Host修复通过了隔离环境的持续遮挡和关闭重开画布像素测试。上述结果不代表真实模型验收完成：此组合的P0 Playwright、P1 Electron和原生中文输入仍是分别待完成的项目。

最近一次由本项目维护的Computer Use测试发生于2026-10-08，因Context Manager无法解析生成摘要（`CONTEXT_MANAGER_BLOCKED`）而在任何原生工具调用前停止，没有取得当前权限、截图或输入结果。之前的权限失败和rc.4成功均为历史证据；后续Context更新本身不能证明Computer Use通过。

本次候选保留原归档，不重打包。仓库中的日期状态说明更新于归档冻结之后，包内文档保留原先证据日期。本版本为明确保留验收限制的预发布，不宣称生产就绪。

## 生产稳定化候选 rc.5

`0.1.0-rc.5` 需要配套 Desktop 稳定化更新。Electron 等待上限为30秒，用户选文件为120秒；停止和接管会及时取消等待。中断前可能已送出输入，不会自动重放；底层命令仍未结束时禁止恢复，应人工检查页面，或关闭并重新打开所拥有的标签。创建标签需在 Desktop 打开该任务；侧栏未挂载会立即说明原因，不会自动切换任务。

原生 `get_window_state` 默认仅截图，拒绝完整 AX 扫描；Cua 0.28 中会进入不安全菜单 AX 路径的 `verify_state` 和 `invoke_menu` 不向模型提供。刷新失败会撤销旧操作许可；只有有效 PNG 成功通过 Host 图像通路后，才允许下一次动作。建议分步执行已授权点击、新截图、无坐标 `type_text`，再读回结果。浏览器结构仍由 Browser Use 的观察提供。

配套 Host 已通过隔离 Electron 44 测试：真正处于后台的 webview 滚动450像素，立即截图包含刚改变的画布，且没有抢占前台。rc.4 独立聚焦路径已通过 ASCII 与中文原生输入；聚焦加输入的组合路径仍未确认。rc.5 归档冻结后的安装与真实模型验收单独记录。P0 Playwright 与 P1 Electron 分别验收，macOS Intel 证据不代表其他平台通过。

[English](README.md) | 中文

`@missher/dsh-computer-browser` 为配套 Missher Desktop 整合版提供按会话归属的浏览器控制及 Cua 桌面工具。可选择可见 Electron 侧栏浏览器或独立可见 Playwright 浏览器；同一时间只启用一个 Browser Use 提供者。

本仓库是独立 Bundle 的唯一维护源码入口。此前 Computer Browser Use 候选工作区保留为历史实现和验证记录，不再作为另一套持续维护的源码。`0.1.0-rc.5` 保留对象根工具 schema，并要求有效原生截图，不是 DeepSeek 官方桌面版本。

## 宿主要求

仅安装本 Bundle 不会补齐 Desktop 功能。所用 Missher Desktop / Host 必须同时具备：

- `automationVersion: 1` 的 Desktop 浏览器桥及配套侧栏客户端，供默认 `electron` 后端使用。
- 原生授权和停止、接管、恢复控制的 Host 适配器。
- MCP `excludedTools` 支持，供 `playwright` 后端使用。
- `runProfile.prepareContext` 启动集成，在加载插件树之前装入可信 Desktop 适配器。
- 2026-10-05 的 Host 与侧栏挂载修复：guest 附加前可读取预约状态，由主进程绑定 lease，并明确返回初始化失败。
- 最终Host截图修复：持续遮挡及关闭重开画布时，操作期间维持所属窗口绘制并归还原节流设置，保留取消、新帧和不抢焦点保护。

官方 Desktop `0.2.0-rc.2` 不包含这些新增能力。已有 Missher Desktop 下载资产也不能仅凭基础版本号判定兼容，较早发布的资产可能仍缺少它们。用户已于 2026-10-05 在本机 `latest-cbu-20261004` 整合版重复复现 Electron `open` 失败；该整合版不能作为 Browser Use 可用基线，仅更新本 Bundle 无法修复挂载。安装前核对配套宿主的发布说明和 [COMPATIBILITY.json](COMPATIBILITY.json)；宽松的 peer 依赖范围不代表已验证兼容。

Cordis、Agent、ToolRuntime、MCP、BrowserUse 与 ComputerUse 共用 Host 服务。本包不安装第二套 Host，也不要求额外安装兼容 Bundle。遇到提供者冲突时拒绝启动；原生组件启动失败时回滚本包已启动的浏览器提供者。

## 浏览器与桌面行为

| 后端 | 可见页面 | 归属与存储 |
| --- | --- | --- |
| `electron`，默认 | `browser_use` 操作的同一个真实侧栏 guest | 绑定准确的活跃会话实例，默认临时存储 |
| `playwright` | 单独启动的可见 Chromium 窗口 | 每个活跃会话实例拥有独立临时 profile 和工作目录 |

`open` 和 `navigate` 必须提供不含内嵌凭据的绝对 HTTP(S) `url`。缺失、空白或不合法的 URL 在 IPC 和创建活跃实例所有权之前拒绝；Host 仍负责最终导航策略。对象根工具 schema 描述各动作的必填字段；同一规则表在创建归属和 IPC 前验证 target、snapshot 和输入字段等条件要求，不使用顶层 schema 联合表达条件必填。

先观察自己的页面，再用当前引用操作，随后读回结果。停止会拒绝新操作，已派发的底层工作可能仍在结束；接管将控制权交给用户，恢复后必须重新观察。取消或超时不会撤销已经送出的输入，也不会自动重放结果不确定的动作。会话隔离保护目标归属，不构成操作系统沙箱。

Electron 上传要求用户通过原生选择器选文件，并使用私有暂存副本。下载要求批准一次传输并选择目标位置。持久登录需要原生确认，作用于此后创建的标签，不改变已有 guest。对话记录、URL、页面运行状态和登录存储互不等同：重启不会恢复旧句柄、旧快照或待执行动作。卸载不会删除用户明确选择保留的登录数据。

Playwright 后端始终启动可见隔离浏览器。本 Bundle 不附着已有浏览器，也不复用日常 profile。任意脚本执行、模型指定的宿主文件路径、任意上传及拖入操作均被排除；截图使用受管理的临时输出。

Cua Driver 使用 Standard 模式。浏览器子工具，包括旧 `page` 入口，均被禁用，以保持浏览器控制的唯一归属。原始 SDK 会话管理、全局配置写入、辅助程序安装、录制和轨迹重放不作为模型工具。既有浏览器 profile 的接入决策通过可信 Host 对话框完成，页面和模型不能自行批准。屏幕录制与辅助功能权限由操作系统管理，不会自动申请。后台动作被拒绝不代表已授权前台重试。

截图通过 Host 图像和附件通路传递；具备图像能力的路由可接收真实图片，纯文本路由可使用 Browser Use 的辅助功能文本，但不能据此授权原生截图坐标输入。本包不虚构 OCR，也不把 base64 文本视作视觉理解。原生桌面协调仅覆盖一个 Host，用户和其他进程仍可改变物理桌面。

## 安装、停用与卸载

使用本仓库 [Releases](https://github.com/Missher12/Missher-DSH-Computer-Browser/releases) 中固定版本的 `.tgz` 和 SHA-256 文件。发布协调者上传并核验资产后，下载链接才可使用；此说明不代表每个候选已经提供公开下载。

1. 确认 Desktop / Host 具备上述能力，且没有同时启用另一 Browser Use 或 Computer Use 提供者。不要删除无关插件或改变模型设置。
2. 在该 Desktop 的插件管理器中安装下载的归档，并按提示重启。保留的 `desktop` profile 必须通过 Desktop 正常通道管理，不能另用无关 CLI 直接写其文件。
3. 检查 Bundle 为 active。在测试对话中打开无敏感页面、读取标题，并核实观察结果。

通过同一插件管理器停用 Bundle，并在提示时重启。移除 `@missher/dsh-computer-browser` 会移除它的配置层，释放所拥有的工具、会话和临时资源；保留已有对话、凭据、其他插件以及明确保留的登录存储。删除登录数据是独立用户操作。

升级前保留前一版本归档，并为受影响的应用及 profile 制作新鲜备份。回滚时 Host 桥和 Bundle 必须继续匹配，只恢复一侧可能导致组合不可用。新增用户数据需另行保留，不能用旧备份直接覆盖。

## 配置

通过 Host 配置入口编辑 `computer-browser` Loader 条目：

```yaml
backend: electron # 或 playwright
sessionTtlSeconds: 3600
idleTtlSeconds: 600
# 仅 Playwright 可选：指定已安装的 Chromium 可执行文件。
# executablePath: /path/to/chromium
# toolCallTimeoutMs: 60000
```

空闲 TTL 不能超过会话 TTL。切换后端需在 Desktop 空闲时重启，会关闭原活跃实例的资源，不迁移正在运行的页面或授权。Bundle 固定 Playwright 为 `mode: launch`、`headless: false`。

## 验证与限制

2026-10-06 已安装配套修复版 Desktop 与 rc.2，但真实 `deepseek-flash` 请求在浏览器动作前拒绝了顶层 `oneOf` 工具 schema。rc.3 改为显式 object 根，保持 `{ action, url, ... }` 调用形式。各动作必填字段由同一规则表生成说明并在创建归属与 IPC 前严格验证；条件必填不再使用顶层 schema 联合表示。归档冻结后的安装和真实模型复验以维护者交付回执为准。

历史 `0.1.0-candidate.1` 的安装和冷启动检查于 2026-10-04 通过，但后续用户报告证明其生产 Electron `open` 路径不可用：侧栏出现标签，guest target 却未挂载。此前 `0.1.0-rc.1` 的 fixture 使用替代 Host 适配器，绕过了生产 claim/state 挂载路径，不能据此判定内置浏览器已可用。

`0.1.0-rc.2` 修复 Bundle 参数要求不一致的问题，仍须配套 Host 与侧栏修复。2026-10-05 的隔离 Electron 44 fixture 经过生产 page/frame/presentation、preload、预约 IPC 和 guest 模块，完成打开、观察、填写、点击、独立 DOM 读回、跨会话拒绝及并发 guest 隔离；同时复现旧状态前置条件故障，并验证初始化与 partition 错误及时返回明确原因。两个 fixture 进程均以代码 0 退出。所截 PNG 显示较早帧，不能算截图新鲜度通过。本次 Host 路径测试没有安装当前归档，也没有验收完整 Desktop 应用。归档冻结后的安装与完整应用组合结果以维护者交付回执为准，不能继承 rc.1 的结果；该 fixture 不证明真实模型或日常安装已验收。精确证据与限制见 [VALIDATION.md](VALIDATION.md)。

此前实现分别完成了可见 Playwright 浏览器和真实 Electron 44 guest 的实际检查，包括表单读回、目标隔离、接管、暂存上传和受控下载。这些历史检查使用自有、无账号 fixture，guest 检查未覆盖本次失败的生产 claim/state 顺序，不代表任意网站或真实付费模型均已验收。

以下为早期隔离 Node 宿主的历史结果，当前日常 Electron 宿主证据见本页顶部。历史测试在 macOS Intel 的 Node 25.6.0 SDK 宿主中，前台输入、AX 点击和独立 renderer 读回通过；后台输入未通过，最终 SDK PNG 仍显示旧画面。动作后的截图新鲜度和完整视觉闭环尚未确认。该测试中 Electron 是受控目标应用，不是 SDK 宿主；独立 Electron SDK 宿主的 TCC 权限和输入也未另行验收。

上述历史检查未进行真实付费模型视觉任务；2026-10-06 的日常真实模型验收见顶部，其适用范围仍是已显示的受控目标。Apple Silicon、Windows 与 Linux 原生行为未验收；上游 SDK 提供平台包不代表本 Bundle 已在该平台实测。原生 SDK 声明 macOS 13 或以上，实际检查机器为 macOS 15.7.4 Intel。

## 源码与许可证

使用本仓库 [package.json](package.json) 声明的脚本构建和测试；运行时安装不依赖相邻 Harness checkout。源码提取基线与哈希记录在 [SOURCE_ORIGINS.json](SOURCE_ORIGINS.json)。Bundle 源码和包在此维护，Desktop / Host 桥的变更仍由其所属仓库维护。

```sh
npm ci --ignore-scripts
npm run check
npm run pack:candidate
```

这些命令仅在本地验证和打包，不发布 Release，也不安装到日常 profile。发布协调者在验证后，从固定源码版本发布接受的归档。

Bundle 使用 MIT 许可证，并为派生 Harness 源码保留 DeepSeek 署名。外部依赖保留各自许可证：Playwright MCP 使用 Apache-2.0，Cua 原生分发还含 MPL-2.0 的 Node runtime。详见 [LICENSE](LICENSE) 与 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。本包归档不内嵌外部 npm 依赖或 Desktop 应用。
