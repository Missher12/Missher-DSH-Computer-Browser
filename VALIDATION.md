# rc.5 release handoff status / 发布交接状态（2026-10-09）

The exact original archive is retained: SHA-256 `6466ee4664614f21703f8e79cf75baed12a6d32307921e14e1e58ca76e339ca1`. Its ten members match the installed macOS Intel package. An isolated source rebuild reproduced `lib/index.js` byte for byte (SHA-256 `9bf990472cfe913ff9d97c44817d86aa723e62baa13a54783cf5cd6a74a51f01`) and TypeScript checking passed. The earlier frozen-source suite passed 134 tests across 12 files; this handoff does not relabel that dated run as a newly executed suite.

原归档保持上述精确SHA，十个成员匹配本机已安装包。本次隔离源码复建的lib逐字节相同，类型检查通过。冻结源码此前的12文件134项测试通过；本次未重复该整组测试，不将历史日志改称新执行结果。

The matching Desktop was installed on 2026-10-08 and passed Loader/client checks. Sustained occlusion and fresh reopened canvas pixels passed in a separate Host fixture, not a real-model session. The maintained native attempt on 2026-10-08 ended `CONTEXT_MANAGER_BLOCKED` before any tool call. Current native permission is unknown; complete rc.5 P0/P1/native real-model acceptance and other-platform native acceptance remain unfinished. Later Context changes are not evidence that those checks passed.

配套Desktop于2026-10-08完成安装及Loader/前端检查。持续遮挡和重开画布新像素通过仅属于独立Host fixture。10/08维护者原生测试在任何工具调用前因Context摘要解析错误停止；当前原生权限未知，rc.5完整P0/P1/原生实模及其他平台原生验收仍未完成。后续Context更新不构成这些项目通过的证据。

Only repository status documentation was refreshed after archive freeze. The packaged documentation remains unchanged; this is an explicit source-documentation difference, not a rebuilt archive or runtime change. Historical sections below retain their original dates and scopes, including failures.

归档冻结后仅更新仓库状态文档，包内说明保持原字节；这是明确记录的源码文档差异，不是重打包或运行件变化。下方历史段落及失败证据保留其原日期与范围。

# rc.5 production stability candidate / 生产稳定化候选

Native observation uses capture-only defaults and blocks full AX, verify_state and invoke_menu. Only a usable inline PNG admitted by the Host image pipeline permits input. Failed refresh, cancelled image projection and stale completion do not retain old permission. SDK 0.28 remains pinned, without automatic input replay or foreground fallback.

原生观察默认仅截图，封闭完整AX、verify_state和invoke_menu。只有有效内嵌PNG成功通过Host图像通路才许可输入；刷新失败、投影取消和迟到的旧观察均不能保留旧许可。SDK保持0.28，不自动重放或切换前台。

The matching Host regression uses real Electron 44, a foreground cover window, independent scroll readback and actual PNG pixels. Background scroll 450px and fresh blue canvas pixels passed without foreground activation. The earlier capturePage path returned old red pixels; the final implementation uses Page.captureScreenshot. Tests also cover commands that never settle, stop/takeover, refusal to resume overlapping work, queued-input cancellation, exact guest close and navigation-crossed captures.

配套Host回归使用真实Electron44、前台遮挡窗口、独立滚动读回和实际PNG像素。后台滚动450px及新蓝色画布通过，未抢前台；此前capturePage曾返回旧红色像素，最终采用Page.captureScreenshot。另测试底层永久无响应、停止/接管、未结束时禁止恢复、取消队列输入、准确guest关闭及跨导航截图。

Source validation: typecheck passed; 12 test files / 134 tests passed (including 84 native tests).

源码验证：类型检查通过，12个测试文件134项通过，其中原生84项。

Post-freeze package checks, matched installation and real-model acceptance are recorded in the separate 2026-10-07 maintainer receipt. Historical sections retain their original scope and version.

冻结后的包核验、配套安装与真实模型验收另见2026-10-07维护者回执；以下历史结果保留原范围和版本。

## Historical rc.4 native input diagnostics / 历史原生输入诊断

2026-10-06: build and TypeScript checking passed. The regression suite contains 115 tests: 114 passed on the first complete run; the one expected system-prompt snapshot change was reviewed, updated, and its integration test passed separately. The diagnostic tests cover the pinned structured result, partial and zero read-back, malformed/oversized/conflicting fields, original-envelope retention and private-field exclusion. No new SDK or dependency version was installed.

2026-10-06：构建和类型检查通过。115 项回归中，完整运行先通过114项；另1项为此次指导文字对应的系统提示快照，审阅更新后定向集成测试通过。诊断覆盖固定SDK结构、部分及零字符读回、畸形/过大/冲突字段、原始结果保留及私密字段不外泄。未更换SDK或依赖版本。

The existing rc.3 daily installation completed the real DeepSeek visible Electron browser loop. On the current permission-granted process, native screenshot, separate foreground click, coordinate-free physical single key, submit and independent readback passed; the changing canvas code was read by the model from actual PNGs. This does not repair or accept combined type_text: its earlier call returned incomplete and the field stayed empty. Background native input, background browser scrolling and full-window AX have the limitations listed in the README. P0 Playwright real-model acceptance and other platforms are still separate.

既有rc.3日常安装完成了真实DeepSeek可见内置浏览器闭环。当前授权进程的原生截图、独立前台点击、无坐标物理单键、提交和独立读回通过，模型从真实PNG读出了变化的canvas标记。组合type_text仍未修复或验收：此前返回输入未完成，框内最终为空。后台原生输入、后台浏览器滚动和完整窗口AX限制见README；P0 Playwright真实模型及其他平台仍单列。

This archive is frozen before post-freeze installation. Exact archive/hash, isolated Loader checks, daily replacement and subsequent live tests are recorded by the coordinator in the rc4-install / permission-confirmed delivery receipt; the historical sections below do not certify rc.4 installation.

归档先冻结，精确包哈希、隔离Loader、日常替换及后续真实复验由协调者在rc4-install / permission-confirmed回执分别记录；下文历史记录不证明rc.4已安装。

# rc.3 live schema repair / 真实模型 schema 修复

2026-10-06: the installed rc.2 tool schema was rejected by deepseek-flash with HTTP 400 before tool execution because its root oneOf lacked type object. The rc.3 candidate advertises an explicit object root and documents each action's fields from the same map used for pre-IPC validation. This preserves the flat call format, URL checks, ownership and fail-closed behavior. Candidate tests and post-freeze installation/live retests are reported separately; the historical evidence below does not establish rc.3 acceptance.

2026-10-06：真实 deepseek-flash 在执行工具前以 400 拒绝已安装 rc.2 的无 object 类型顶层 oneOf。rc.3 使用显式 object 根，同一规则表生成动作字段说明并做 IPC 前严格校验，保留现有调用形式、URL 检查和归属保护。本轮测试、归档冻结后的安装与真实模型复验单独报告；下文历史证据不证明 rc.3 已验收。

# Validation / 验证

Date: 2026-10-05. Version: `0.1.0-rc.2`.

This candidate fixes action-specific arguments and URL validation in the Electron provider. It does not contain the separate Host/Sidebar attachment repair. Earlier fixture checks did not establish a working production browser attachment path.

本候选修复 Electron 提供者按动作区分的参数要求与 URL 校验，不包含另行实现的 Host/侧栏挂载修复。此前 fixture 检查不能证明生产浏览器挂载路径已可用。

## Checks completed / 已完成检查

- Standalone `npm run check` rebuilt the package and passed TypeScript checking on macOS Intel, Node 25.6.0. This reused the existing policy-installed dependency tree; no new dependency installation was needed.
- 83 regression tests in 12 files passed. The added cases validate the advertised action schema and generated SDK, reject missing or invalid open/navigate URLs before IPC or ownership, and preserve valid requests unchanged. They cover resource lifecycle, cancellation, isolation, MCP policy, native authority/results/catalog and Bundle composition. The real published MCP transport was exercised against a deterministic local server; disallowed calls were rejected before dispatch even without the newer Host catalog filter. Test brokers and native SDK fixtures do not represent real OS or model acceptance.
- Standalone runtime output contains eight owned modules. Cordis and shared Host services remain external.

macOS Intel / Node 25.6.0 已通过独立 `npm run check` 构建和类型检查，复用已有合规安装的依赖，本次没有重新安装依赖。12 文件的 83 项回归覆盖参数 schema/SDK、无效 URL 在 IPC 与所有权创建前拒绝、有效请求原样传递，以及生命周期、取消、隔离、MCP 策略、原生授权/结果/目录及 Bundle 组合。真实发布版 MCP 配合本地确定性服务验证了执行拒绝，旧 Host 缺目录过滤也不会发送被禁操作。测试替身不代表真实 OS 或模型验收。运行产物仅内联八个自有模块，共享宿主服务保持外部依赖。

## Production attachment failure / 生产挂载故障

On 2026-10-05 the user repeatedly reproduced Electron `open` failure with `0.1.0-candidate.1` in `latest-cbu-20261004`: Sidebar tabs appeared, but the model received no guest target and `open` timed out after about 15 seconds. The production state IPC required an attached guest while the client requested state before presenting the webview. The old rc.1 Host fixture supplied a synthetic Desktop adapter and bypassed this production claim/state sequence.

2026-10-05，用户在 `latest-cbu-20261004` 的 `0.1.0-candidate.1` 上重复复现 Electron `open` 失败：侧栏出现标签，但模型没有获得 guest target，约 15 秒后超时。生产 state IPC 要求 guest 已附加，而客户端在呈现 webview 之前读取 state；旧 rc.1 Host fixture 提供替代 Desktop 适配器，绕过了该生产 claim/state 顺序。

This Bundle now rejects a missing URL with a direct argument error. Opening a valid URL still requires the matching Host and Sidebar repair. Its production-path native fixture passed within the scope below. The fixture did not exercise installation or loading of this rc.2 archive with the complete repaired Desktop application. Results for that combination are recorded in the maintainer delivery receipt after this archive is frozen; they must not inherit rc.1 acceptance. No real-model task, daily installation or publication is established by this fixture.

本 Bundle 现会直接以参数错误拒绝缺失 URL。有效 URL 的打开仍要求配套 Host 与侧栏修复；新的生产路径原生 fixture 已在下述范围内通过，但 fixture 不覆盖当前 rc.2 归档与完整修复版 Desktop 的安装及组合加载。归档冻结后的组合安装结果以维护者交付回执为准，不能继承 rc.1 的验收；该 fixture 不证明真实模型任务、日常安装或发布已完成。

## Native production-path check / 原生生产路径检查

On 2026-10-05 the isolated macOS Intel fixture ran Electron `44.0.0` twice against an owned window and loopback form. It used production `createElectronPage`, frame/presentation, preload, reservation IPC and guest modules. Both baseline and fixed processes completed cleanup and exited with code 0.

- Restoring the old state precondition reproduced the failure in 48 ms, with zero attached guests. This establishes the causal ordering problem; it does not reproduce the old 15-second timeout duration.
- The repaired path opened and observed the native guest, filled and clicked using fresh references, and independently read the input and saved result from the guest DOM. An attempt from another session was rejected.
- Three distinct guests were created, including concurrent opens with same-partition ownership; creation evidence matched the exact lease, host and partition.
- Injected presentation failure and partition mismatch returned explicit codes/reasons in 46 ms and 43 ms. The actual frame retained each reason, stopped loading and created no extra attached guest.
- The saved PNG showed an earlier frame. Screenshot freshness and a complete visual loop were not accepted; DOM read-back is the result evidence.

2026-10-05 的 macOS Intel 隔离 fixture 使用自有窗口和本机回环表单，运行两次 Electron `44.0.0`，经过生产 `createElectronPage`、frame/presentation、preload、预约 IPC 与 guest 模块。基线和修复进程均完成清理并以代码 0 退出。旧状态前置条件在 48 毫秒、零附加 guest 时复现失败，证明顺序问题，不等于复现旧版 15 秒超时。修复链路完成打开、观察、使用新引用填写与点击，并从 guest DOM 独立读回输入及保存结果；另一会话访问被拒绝。三个独立 guest（含同 partition 并发打开）的 lease、host、partition 归属匹配。注入的呈现初始化失败和 partition 不匹配分别在 46、43 毫秒返回明确代码与原因，真实 frame 保留错误并停止加载，没有增加附加 guest。PNG 显示较早帧，截图新鲜度与完整视觉闭环未验收，动作结果以 DOM 独立读回为证。

Evidence record / 证据标识：`dsh-browser-sidebar-native-i6EjbA/result.json`; SHA-256: `60a9172e358566b09010345a6b5c981fb5dfd64f99b78ef9868ae2cb717f4d81`. The coordinator retains the source fixture, logs and image. This is Host/Sidebar path evidence, not rc.2 archive loading, complete-app acceptance or fresh native Cua acceptance. 协调者保留 fixture 源码、日志和图片；这是 Host/侧栏路径证据，不等同于 rc.2 归档加载、完整应用或新一轮 Cua 原生验收。

## Historical rc.1 package lifecycle / 历史 rc.1 包生命周期

The following checks belong to `0.1.0-rc.1`, not to this new archive. The `latest-cbu-20261004` Desktop carrier was read without modification. Its formal `runDesktopCli` path managed a fresh SDK-derived verification profile with a separate HOME and DSH_HOME. The actual PluginManager installed the archive and compared every package file with the archive. Production profile boot loaded the providers and discovered the real Cua SDK catalog using synthetic trusted Desktop adapters that never authorize OS input. Provider conflict rejection, disable/re-enable with restart, incompatible-update rejection, malformed-patch rollback and uninstall were checked with unrelated plugin and session data preserved.

下述检查属于 `0.1.0-rc.1`，不属于当前新归档。rc.1 阶段只读配套 Desktop 载体，以正式 `runDesktopCli` 管理全新 SDK 派生的验证 profile，HOME 与 DSH_HOME 均隔离。实际 PluginManager 安装后逐文件比对归档，生产 profile 启动加载提供者并读取真实 Cua SDK 目录；可信 Desktop 适配器为不会授权 OS 输入的测试替身。检查覆盖提供者冲突拒绝、停用重启及恢复、不兼容更新拒绝、无效配置安装回滚和卸载，并保留无关插件与会话数据。

The fresh dependency cache initially rejected offline installation; the same isolated profile was then installed online with its package-manager policies retained. Peer-resolution diagnostics are retained separately from successful Host module resolution. No admission or package-manager safety check was disabled.

全新依赖缓存最初无法离线安装，随后在同一隔离 profile 联网安装，保留包管理器策略。peer 解析提示与实际 Host 模块解析结果分开保留，没有关闭准入或包管理安全检查。

To repeat this optional macOS carrier check, set `DSH_TEST_APP` to a compatible `.app`, then run `node scripts/verify-install.mjs` with phases `prepare`, `add`, `load`, `reject`, `rollback`, and `remove` in that order. Each prepare creates a new isolated directory. `DSH_TEST_OFFLINE=1` requires dependencies already cached there. The application is only read; the helper never selects a daily profile. Standalone build and unit tests do not require a Desktop application.

可选的 macOS 载体复验：指定兼容 `.app` 的 `DSH_TEST_APP` 后，依次执行 `node scripts/verify-install.mjs prepare`、`add`、`load`、`reject`、`rollback`、`remove`。每次 prepare 创建新隔离目录；`DSH_TEST_OFFLINE=1` 要求该目录已有依赖缓存。脚本只读应用且不选择日常 profile。独立构建及单元测试不依赖 Desktop 应用。

Each candidate archive has its own hash. The rc.1 archive and the earlier rc.2 archive (SHA-256 `0b6e723294bd5a7c405faf558d934fa8b1f75bdd46ba8cf8869a14feb57611f9`) are retained unchanged. The final documentation package is written separately under `.artifacts/attach-fix-final/`, with its own hash and file comparison receipt; its runtime bytes remain the tested rc.2 output.

每个候选归档使用独立哈希。旧 rc.1 和早期 rc.2 归档（SHA-256 如上）保持不变，最终文档包另存 `.artifacts/attach-fix-final/`，附独立哈希及逐文件比对回执；运行时代码保持已测 rc.2 字节。

## Boundaries / 边界

- The older `0.1.0-candidate.1` was installed locally in `latest-cbu-20261004`; that is separate from this archive's verification.
- Historical P0 visible Playwright and P1 direct guest fixtures remain useful evidence within their exercised paths. The direct guest fixtures did not test the failing production claim/state attachment sequence. The new native Host/Sidebar fixture covers that sequence; the rc.2 archive plus complete application requires its own post-freeze maintainer installation receipt.
- This Bundle candidate preparation does not call paid models, use real accounts, mutate the daily profile or grant OS permissions. The user report's successful Cua diagnostics and screenshots are scoped observations, not fresh full native acceptance.
- Native desktop input has partial earlier evidence. Fresh post-action PNGs, background input and a real model visual loop remain unverified.
- Official rc.2 lacks required trusted Host extensions. Apple Silicon, Windows and Linux native acceptance remains outstanding. A Linux CI unit-test result does not establish Linux desktop acceptance.

旧 candidate.1 的安装、历史 P0/直接 P1 guest fixture 与当前包验证分别记录；直接 guest fixture 未覆盖失败的生产 claim/state 挂载顺序，新 Host/侧栏原生 fixture 已覆盖该顺序；rc.2 归档与完整应用的组合安装结果以归档冻结后的独立维护者回执为准。本次 Bundle 候选准备没有付费模型调用、账号接入、日常 profile 改写或 OS 授权。用户报告中的 Cua 诊断与截图仅是该场景观察，不代表已刷新全量原生验收。原生动作后 PNG 新鲜度、后台输入、真实模型视觉闭环和其他平台原生验收继续保留为未完成；官方 rc.2 缺少必要的可信宿主扩展。Linux CI 单元检查不代表 Linux 桌面验收。
