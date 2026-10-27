# GitHub 仓库设置与发布指南

[English](github-setup.md) | **简体中文**

适用于 LearnDistill · 学萃。设置入口依据 GitHub 官方文档，于 **2026-10-27** 核对；界面可能随账号计划和 GitHub 更新变化。下文是建议配置，不代表已替你修改远程仓库。

## 1. 先完成可发布的版本

当前已核对：远程仓库为 `Artoria67/LearnDistill`，可见性为 **Private**，默认分支为 `main`。本地尚无项目根目录 `LICENSE` 和 GitHub Actions 工作流；本地修改需要提交并推送，才会出现在 GitHub 上。

按此顺序推进：

1. 确定代码和 skill 说明的许可证，再添加根目录 `LICENSE`。如果目标是允许他人广泛使用、修改和再分发，可优先了解 [MIT](https://choosealicense.com/licenses/mit/)。这只是建议，尚未为项目采用该协议。
2. 保留第三方示例自身的归属和授权。FNC 习题册内已有来源及 CC BY-SA 4.0 说明，不能把它直接改称为整个项目代码所选的许可证。
3. 核对中英文安装步骤与示例链接，再检查准备公开的提交及历史。`.gitignore` 不会移除已经提交的文件。
4. 运行下面的检查，审阅改动，提交并推送到实际要发布的分支。

```sh
npm run setup
npm run validate
npm test
git diff --check
git status --short
```

本项目的 PDF 测试需要可用的 Chromium 系浏览器，中文示例还需要中文字体。配置允许使用不等于完成了客户端兼容性实测；发布说明应区分这两件事。

公开可见和开源授权是不同事项。许可证应由项目维护者明确选择。参考 [GitHub 许可证说明](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)。

## 2. 名称、描述与 About

**当前仓库名：`LearnDistill`。** GitHub 仓库已经完成改名，与项目品牌一致。

已有的本地克隆可更新为当前仓库地址：

```sh
git remote set-url origin https://github.com/Artoria67/LearnDistill.git
git remote -v
```

中英文 README、贡献指南和安装文案中的仓库、Issues、PR 链接均使用当前地址。如以后再次改名，应在 GitHub 改名成功后同步更新这些链接。参考 [GitHub 仓库改名说明](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)。

在仓库首页右侧 **About → 齿轮** 中设置 Description、Website 和 Topics。Description 是一个字段，不会根据访问者语言自动切换；建议填写下面的双语合并版。

**英文描述：**

```text
Turn textbooks, lecture notes and worked solutions into study-ready Markdown and PDF with a portable Agent Skill.
```

**中文描述：**

```text
学萃：把教材、讲义和题解，按学习时间整理成可编辑的 Markdown 与 PDF；面向多种 Agent 工具。
```

**推荐填入 About 的双语版：**

```text
Study-ready Markdown & PDF from textbooks and notes, with a portable Agent Skill. 学萃：按学习时间精炼教材、讲义和题解。
```

没有独立文档站时，Website 留空即可。README 已是使用入口，无需为了填满字段临时搭建网站。

## 3. Topics、版本 tag 与问题标签

- **Topics** 是首页的分类标签，帮助用户按用途和生态发现仓库。
- **Git tag** 如 `v0.1.0`，标记具体版本，用于发布和回溯。
- **Issue labels** 如 `bug`、`documentation`、`good first issue`，用于管理反馈和贡献。

在 About → 齿轮 → Topics 中逐个添加，保存更改。建议先用以下 12 个相关标签：

```text
agent-skills
study-notes
textbook
education
markdown
pdf
codex
claude-code
cursor
deepseek-harness
trae
workbuddy
```

GitHub 允许最多 20 个 Topics，每个最多 50 个字符，使用小写字母、数字和连字符。Topics 本身即使在私有仓库中也始终公开。标签应与实际用途相符，不要添加无关热门词。参考 [GitHub Topics 文档](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics)。

## 4. Settings → General

以下是适合当前小型个人项目的建议：

| 区域或选项 | 建议 | 原因 |
| --- | --- | --- |
| Features → Issues | 开启 | 统一接收缺陷与兼容性反馈。 |
| Features → Discussions | 需要问答社区时开启 | 开启后先准备置顶欢迎帖和 FAQ；没有维护计划时可稍后开启。 |
| Features → Wiki | 暂不开启 | 双语文档已在仓库中，避免维护第二套说明。 |
| Features → Projects | 有实际任务排期再启用 | 早期用 Issues 即可。 |
| Pull Requests → Allow squash merging | 开启 | 一个 PR 合并为一个提交，便于回查和撤回。 |
| Allow merge commits / Allow rebase merging | 初期可关闭 | 保持一种主要合并方式，降低维护复杂度。 |
| Automatically delete head branches | 开启 | 合并后清理工作分支。 |
| Default branch | 保持 `main` | 与首发版本目标分支一致。 |

这些是维护建议，不是增加搜索排名的开关。功能入口参考 [Discussions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/enabling-or-disabling-github-discussions-for-a-repository) 和 [Squash merge](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/configuring-commit-squashing-for-pull-requests) 官方说明。

## 5. 主分支保护

在 **Settings → Branches → Add classic branch protection rule** 中，为 `main` 添加规则。GitHub Free 支持公开仓库的受保护分支；私有仓库的可用性取决于计划，必要时在公开后完成配置。

| 选项 | 建议 |
| --- | --- |
| Branch name pattern | `main` |
| Require a pull request before merging | 开启，方便把贡献放进 PR 审阅。 |
| Require approvals | 独自维护时先不勾选；有其他维护者后再考虑要求 1 人批准。 |
| Require conversation resolution before merging | 开启。 |
| Require status checks to pass before merging | 等真正添加 CI 且成功运行后，再选择真实产生的检查名称。 |
| Allow force pushes | 不勾选。 |
| Allow deletions | 不勾选。 |
| Do not allow bypassing the above settings | 初期可不勾选，保留管理员处理配置错误的能力。 |

目前没有 CI 工作流，不要先填写一个尚不存在的 required check。也不要在只有你维护时，强制要求另一个人批准自己的 PR。参考 [主分支保护配置](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule)。

## 6. Actions 与依赖提醒

在 **Settings → Actions → General** 中：

- Workflow permissions 选择 **Read repository contents and packages permissions**。以后某个工作流确实需要写权限，再在该工作流中最小化授予。
- 外部 fork 工作流保留首次贡献者审批要求；初期无需打开“允许 Actions 创建和批准 PR”。
- 真正添加 CI 时，除了 `npm run setup`、`npm run validate` 和 `npm test`，还需为 runner 准备浏览器和所需字体。

在 **Settings → Advanced Security** 中启用可用的 Dependabot alerts。它用于依赖漏洞提醒，不代表转换器或学习内容已经过全面审查。操作入口参考 [Actions 设置](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository) 和 [Dependabot alerts](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configure-dependabot-alerts)。

## 7. 改为公开与分享预览图

文档、示例和许可证准备好并推送后，在 **Settings → General → Danger Zone → Change repository visibility** 选择 Public，核对仓库名并确认。Git 历史与 Actions 日志也属于公开范围；应在此之前完成审阅。参考 [可见性设置](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility)。

之后在 **Settings → General → Social preview → Edit → Upload an image** 上传项目分享图：

- 推荐 **1280 × 640**，PNG/JPG/GIF，**小于 1 MB**。
- 内容用 `LearnDistill · 学萃`、一句用途说明和真实输出截图即可。少放字，保证缩略图可读。
- 可提前准备图片。GitHub 官方说明首次上传面向公开仓库；私有仓库仅在此前已上传过图片的情况下支持上传，所以这一步可能要在公开后完成。

分享图影响链接在社交平台上的展示。参考 [Social preview 官方要求](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview)。

## 8. 创建首个 Release

当前包和插件版本为 `0.1.0`。完成该版本的发布检查后，可在仓库首页 **Releases → Draft a new release** 中：

1. 创建 tag `v0.1.0`，Target 选择已经推送并核验的 `main` 提交。
2. 标题可用 `LearnDistill v0.1.0 — Study-ready notes / 学萃首发`。
3. 用中英文说明用途、安装方法、示例和已知限制。明确实际测试过的系统与客户端，不把“有安装说明”写成“全部客户端已实测”。
4. 可附只含完整 skill 目录的 ZIP，便于本地导入；保留资源与依赖声明，不打包 `node_modules/`、用户原始材料或临时产物。
5. 内容就绪前保存为 Draft；准备好后再 Publish release。尚属实验阶段时勾选 Pre-release。

参考 [Release 操作步骤](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)。GitHub 公开不会自动把 skill 上架到各 agent 的技能市场。

## 9. 让更多合适的用户看到

设置只能改善项目的展示与发现条件，不能保证曝光或 Star。建议把精力按以下顺序投入：

1. **安装能复现。** 请不同系统或 agent 的使用者从干净目录安装一次，记录真实失败并修复。
2. **展示实际前后变化。** 用一张原资料截图和一张生成结果截图，或 30–60 秒演示，说明输入、学习预算和输出。保留 README 中的 PDF 参考链接。
3. **围绕一个具体场景发布。** 例如“把数值计算教材整理成两小时讲义”，比只说“万能学习神器”更容易让人理解用途。
4. **面向相关社区分享。** 按各社区规则，把双语介绍、安装方法和示例发到你实际使用的 agent 或学习社区；之后再考虑技能目录收录。
5. **给出能参与的任务。** 例如“在 macOS 上验证安装与 PDF 转换并报告版本”，再配合真实的 `good first issue`，不要创建空泛占位任务。

公开后可在 **Insights → Traffic** 查看近期访问、完整 clone 和来源；GitHub 的该视图覆盖过去 14 天。每周关注安装反馈和复现结果，不只盯 Star。参考 [仓库流量统计](https://docs.github.com/en/repositories/viewing-activity-and-data-for-your-repository/viewing-traffic-to-a-repository)。

## 10. 保持两种语言同步

- [英文 README](../README.md) 是 GitHub 默认入口，[中文 README](../README.zh-CN.md) 提供完整中文说明，两者顶部互链。
- 更新安装命令、支持条件或能力表述时，同步改两版；翻译不必逐句相同，但事实和操作应一致。
- 贡献指南也分为 [英文](../CONTRIBUTING.md) 和 [中文](../CONTRIBUTING.zh-CN.md)。Issues 与 PR 接受两种语言。
- 示例文件标清实际语言；当前 FNC PDF 为中文讲义及带中文提示的题册，没有假称已提供英文 PDF。

优先级：**许可证与可安装版本 → 清楚的双语入口 → Description/Topics → 首个 Release → 演示与反馈 → 逐步扩大客户端实测。**
