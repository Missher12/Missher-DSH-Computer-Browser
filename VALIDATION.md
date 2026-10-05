# Validation / 验证

Date: 2026-10-05. Version: `0.1.0-rc.1`.

This independently maintained package extracts the previously tested Computer Browser Use implementation. It adds local build inputs, published development dependencies, explicit trusted Host capability checks, and standalone regression tests. It does not embed a replacement Host.

本包将此前实现整理为独立维护源码，补齐本地构建输入、已发布的开发依赖、可信宿主能力检查和独立回归测试，不内嵌替代宿主。

## Checks completed / 已完成检查

- Standalone `npm install --ignore-scripts`, build and TypeScript checking passed on macOS Intel, Node 25.6.0.
- 77 regression tests in 12 files passed. They cover resource lifecycle, cancellation, isolation, MCP policy, native authority/results/catalog and Bundle composition. The real published MCP transport was exercised against a deterministic local server; disallowed calls were rejected before dispatch even without the newer Host catalog filter. Test brokers and native SDK fixtures do not represent real OS or model acceptance.
- Standalone runtime output contains eight owned modules. Cordis and shared Host services remain external.

macOS Intel / Node 25.6.0 已通过独立依赖安装、构建和类型检查；12 文件的 77 项回归覆盖生命周期、取消、隔离、MCP 策略、原生授权/结果/目录及 Bundle 组合。真实发布版 MCP 配合本地确定性服务验证了执行拒绝，旧 Host 缺目录过滤也不会发送被禁操作。测试替身不代表真实 OS 或模型验收。运行产物仅内联八个自有模块，共享宿主服务保持外部依赖。

## Isolated package lifecycle / 隔离包生命周期

The `latest-cbu-20261004` Desktop carrier was read without modification. Its formal `runDesktopCli` path managed a fresh SDK-derived verification profile with a separate HOME and DSH_HOME. The actual PluginManager installed the archive and compared every package file with the archive. Production profile boot loaded the providers and discovered the real Cua SDK catalog using synthetic trusted Desktop adapters that never authorize OS input. Provider conflict rejection, disable/re-enable with restart, incompatible-update rejection, malformed-patch rollback and uninstall were checked with unrelated plugin and session data preserved.

本轮只读配套 Desktop 载体，以正式 `runDesktopCli` 管理全新 SDK 派生的验证 profile，HOME 与 DSH_HOME 均隔离。实际 PluginManager 安装后逐文件比对归档，生产 profile 启动加载提供者并读取真实 Cua SDK 目录；可信 Desktop 适配器为不会授权 OS 输入的测试替身。检查覆盖提供者冲突拒绝、停用重启及恢复、不兼容更新拒绝、无效配置安装回滚和卸载，并保留无关插件与会话数据。

The fresh dependency cache initially rejected offline installation; the same isolated profile was then installed online with its package-manager policies retained. Peer-resolution diagnostics are retained separately from successful Host module resolution. No admission or package-manager safety check was disabled.

全新依赖缓存最初无法离线安装，随后在同一隔离 profile 联网安装，保留包管理器策略。peer 解析提示与实际 Host 模块解析结果分开保留，没有关闭准入或包管理安全检查。

To repeat this optional macOS carrier check, set `DSH_TEST_APP` to a compatible `.app`, then run `node scripts/verify-install.mjs` with phases `prepare`, `add`, `load`, `reject`, `rollback`, and `remove` in that order. Each prepare creates a new isolated directory. `DSH_TEST_OFFLINE=1` requires dependencies already cached there. The application is only read; the helper never selects a daily profile. Standalone build and unit tests do not require a Desktop application.

可选的 macOS 载体复验：指定兼容 `.app` 的 `DSH_TEST_APP` 后，依次执行 `node scripts/verify-install.mjs prepare`、`add`、`load`、`reject`、`rollback`、`remove`。每次 prepare 创建新隔离目录；`DSH_TEST_OFFLINE=1` 要求该目录已有依赖缓存。脚本只读应用且不选择日常 profile。独立构建及单元测试不依赖 Desktop 应用。

The final delivery receipt records archive hashes and isolated installation results. See the repository's fixed commit and maintainer delivery evidence for the exact candidate.

最终归档哈希及隔离安装结果记录于维护者交付回执，以固定提交及对应候选证据为准。

## Boundaries / 边界

- The older `0.1.0-candidate.1` was installed locally in `latest-cbu-20261004`; that is separate from this archive's verification.
- P0 visible Playwright and P1 Electron guest fixture acceptance were recorded in the earlier implementation round. No new native UI acceptance is claimed by standalone unit tests.
- No paid model, real account, daily profile mutation or OS permission grant is part of this round.
- Native desktop input has partial earlier evidence. Fresh post-action PNGs, background input and a real model visual loop remain unverified.
- Official rc.2 lacks required trusted Host extensions. Apple Silicon, Windows and Linux native acceptance remains outstanding. A Linux CI unit-test result does not establish Linux desktop acceptance.

旧 candidate.1 的日常安装、此前 P0/P1 的真实 fixture 页面验证与当前包验证分别记录。本轮没有付费模型调用、账号接入、日常 profile 改写或 OS 授权。原生动作后 PNG 新鲜度、后台输入、真实模型视觉闭环和其他平台原生验收继续保留为未完成；官方 rc.2 缺少必要的可信宿主扩展。Linux CI 单元检查不代表 Linux 桌面验收。
