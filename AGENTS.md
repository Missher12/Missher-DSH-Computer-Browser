# Computer Browser Use

默认使用简体中文。先读 [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)、[README.md](README.md) 和 [COMPATIBILITY.json](COMPATIBILITY.json)，再核验当前分支、未提交改动及验证记录。

- 本仓库是 `@missher/dsh-computer-browser` 的唯一维护源码。旧 Computer Browser Use 候选仅保留历史和回滚依据，不双向维护，不将其生成物反向覆盖当前源码。
- Bundle 的服务适配和运行时协调归本仓库；Desktop 主进程、Host 适配器和侧栏客户端归宿主仓库。保持单一写入者，不将公共 Host 实现复制进本包。
- Cordis / Agent / ToolRuntime / MCP / BrowserUse / ComputerUse 共用 Host 实例。缺少能力时明确拒绝，不通过重复运行时或模型提供的授权绕过。
- 保留精确活跃会话归属、旧快照拒绝、停止和接管语义。取消不保证撤销已送出的输入；不得自动重放结果不确定的动作或自动改为前台输入。
- 构建、测试和打包使用独立临时输出或本仓库产物。不得改日常应用、profile、会话、凭据、学习库和既有浏览器数据；真实账号、系统授权和付费模型操作需明确授权。
- 源码、生成物、隔离安装、原生 UI、真实模型、日常安装和公开发布分别报告。上游存在某平台包不代表本项目已验收该平台。
- 改动相应行为时同步 README 双语、能力说明和有意义的回归。新增或更新派生源码时保留版权，并更新 [SOURCE_ORIGINS.json](SOURCE_ORIGINS.json) 和 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。来源哈希记录提取基线，不伪装成后续改动的当前哈希。
- 发布按协调计划执行：源码所有者交付固定 SHA 和精确包，Release 与社区目录由指定协调者单写。不要覆盖已发布资产或声称尚未合并的市场投稿已上架。
