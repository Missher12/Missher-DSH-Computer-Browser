# Computer Browser Use 维护上下文

更新日期：2026-10-05。任务：MARKET-20261005。包名 `@missher/dsh-computer-browser`，本轮版本 `0.1.0-rc.1`。仓库：<https://github.com/Missher12/Missher-DSH-Computer-Browser>。

## 当前职责

本仓库承接 2026-10-03 Computer Browser Use 候选的 Bundle、浏览器提供者及原生提供者源码，成为独立插件的唯一维护入口。旧候选保持历史记录，不删除、不继续双向开发。宿主的 Desktop bridge、Host authorization / interaction adapters、sidebar client 和冷启动 `runProfile.prepareContext` 修复仍归宿主源码仓库。

## 版本与验证事实

- `0.1.0-candidate.1` 已在 2026-10-04 本机 macOS Intel `latest-cbu-20261004` 整合版安装并通过加载、客户端字节和冷启动检查；这是有日期的历史安装证据。
- `0.1.0-rc.1` 是本轮独立仓库包装候选。是否已构建、安装或发布，只认本轮 [VALIDATION.md](VALIDATION.md)、归档哈希与协调发布回执，不继承 candidate.1 的安装结论。
- 既有真实 Playwright 和 Electron guest 检查各自保留。Node SDK 原生前台输入、AX 点击和独立读回通过，但后台输入未通过、动作后 PNG 新鲜度未确认；Electron SDK 宿主权限和输入、真实模型看图及其他平台未验收。
- 官方 rc.2 和已有 Missher 公开桌面资产不一定包含配套桥；安装必须核验能力及冷启动适配器顺序，不能仅检查版本字符串。

## 市场交付

当前官方贡献规范入口：<https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md>。拟分类 `browser`。仓库创建时间为 `2026-10-05T12:53:42Z`；24 小时门槛最早于 `2026-10-06T12:53:42Z`，即北京时间 2026-10-06 20:53:42 满足。首次投稿前由协调者重新核验规则和仓库年龄，不能改写创建时间或复用其他仓库条目绕过。

本轮不写日常应用或数据。固定版本 tarball、校验值、安装与数据保留说明准备并公开回读后，由协调者提交独立 YAML / PR；CI、维护者合并和市场可检索状态分开记录。
