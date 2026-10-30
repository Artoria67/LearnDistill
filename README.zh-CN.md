# LearnDistill · 学萃

[English](README.md) | **简体中文**

**把教材、讲义和题解，整理成适合你的学习时间与基础的学习资料。**

提供 PDF、文档、照片或网页链接，告诉 agent 你的学习目标和可用时间，即可整理出可编辑的 **Markdown 源文件、HTML 预览和 PDF**。保留原文章节、题号、公式、图表与必要条件，方便理解和回查。

采用 [Agent Skills 开放格式](https://agentskills.io/specification)，面向具备文件读写和命令执行能力的 agent 工具。下方提供 Codex、Claude Code、Cursor、GitHub Copilot（VS Code）、DeepSeek Harness、WorkBuddy 和 TRAE 的安装方式。

## 安装

### 把仓库链接交给 agent

对于能够访问仓库并复制文件的 agent，可以发送：

```text
请从 https://github.com/Artoria67/LearnDistill 安装
skills/learn-distill 这个 skill，放到当前工具支持的项目级 skills 目录。
请复制整个 skill 目录，保留 scripts、references、assets 和依赖文件，
检查运行环境，并按需安装转换依赖。安装后确认能读取 SKILL.md 并运行环境检查。
```

这需要 agent 能访问仓库并写入安装目录。仅粘贴链接不会让所有工具自动完成安装；WorkBuddy 的本地技能包使用下文的上传方式导入。

### 使用安装脚本

先准备 [Node.js 20+](https://nodejs.org/)，下载仓库后运行：

```sh
git clone https://github.com/Artoria67/LearnDistill.git learn-distill
cd learn-distill
node scripts/install.mjs --agent codex --scope user
```

`--agent` 当前内置支持 `codex`、`claude-code`、`cursor` 和 `copilot`。把 `codex` 换成对应标识，即可安装到该工具的个人目录。仅在某个项目使用时，运行：

```sh
node scripts/install.mjs --agent claude-code --scope project --project-dir "../my-study-project"
```

也可手动将整个 `skills/learn-distill/` 文件夹复制到下表中的目录。内置 `--agent` 选项使用表中对应路径；其他目录使用 `--dest` 指定。脚本遇到同名目录会停止，不覆盖已有文件。WorkBuddy 按表中入口上传技能包。

| 工具 | 项目级目录或导入入口 | 个人目录 | 使用方式 |
| --- | --- | --- | --- |
| [Codex](https://developers.openai.com/codex/skills/) | `.agents/skills/` | `~/.agents/skills/` | `$learn-distill` 或自然语言 |
| [Claude Code](https://code.claude.com/docs/en/skills) | `.claude/skills/` | `~/.claude/skills/` | `/learn-distill` 或自然语言 |
| [Cursor](https://cursor.com/docs/skills) | `.cursor/skills/` | `~/.cursor/skills/` | 在 `/` 菜单选择或使用自然语言 |
| [GitHub Copilot（VS Code）](https://code.visualstudio.com/docs/agent-customization/agent-skills) | `.github/skills/` | `~/.copilot/skills/` | 在 `/` 菜单选择或使用自然语言 |
| [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill-filesystem/README.md) | `.dsh/skills/` | 默认 `~/.dsh/skills/` | `/learn-distill` 或自然语言 |
| [WorkBuddy](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market) | 技能页 → 添加技能 → 上传技能 | 由客户端管理 | 在已安装列表确认启用后，通过自然语言调用 |
| [TRAE](https://docs.trae.cn/ide_skills) | `.trae/skills/` | 国内版：`~/.trae-cn/skills/` | 通过自然语言指定使用 `learn-distill` |

表中目录下都应包含 `learn-distill/SKILL.md`。`~` 表示用户主目录；安装后按工具要求刷新 skills 或新开会话。DeepSeek Harness 若设置了 `DSH_HOME`，个人技能目录为该目录下的 `skills/`。

### DeepSeek Harness、TRAE 与 WorkBuddy

**DeepSeek Harness / TRAE：** 下载仓库后，可以通过 `--dest` 安装到目标项目的技能目录；下列两条命令按所用工具任选一条：

```sh
# DeepSeek Harness
node scripts/install.mjs --dest "../my-study-project/.dsh/skills"

# TRAE
node scripts/install.mjs --dest "../my-study-project/.trae/skills"
```

TRAE 也支持在“设置 → 技能与命令 → 创建”中导入本地技能。请保留整个 skill 的资源；仅导入 `SKILL.md` 不包含转换脚本。若与其他 agent 共用项目的 `.agents/skills/`，需在 TRAE 的“设置 → 技能与命令 → 导入设置”中打开“启用 .agents 技能目录”。

**WorkBuddy：** 下载仓库，将 `skills/learn-distill/` 打包为本地技能 ZIP，保留 `SKILL.md`、脚本、参考文件、样式和依赖声明，不打包 `node_modules/`。在左侧“专家·技能·连接器 → 技能”中选择“添加技能 → 上传技能”，导入后到“已安装”确认启用，再发送“使用 learn-distill 整理这些资料”。其对话安装功能面向技能市场中的技能，本仓库使用上述本地上传流程。

其他支持 Agent Skills 的工具，可以复制同一目录，或指定其 skills 目录：

```sh
node scripts/install.mjs --dest "/path/to/your-agent/skills"
```

以上路径依据各工具官方文档；已验证安装后的目录可独立运行转换器，尚未逐一完成各客户端的发现与调用实测。仓库中的 Codex 插件配置仅是可选入口，其他工具直接使用 skill 目录即可。

### 准备 PDF 转换环境

在**安装后的 `learn-distill` 目录**中执行：

```sh
node scripts/check_environment.mjs
npm ci --omit=dev --ignore-scripts
node scripts/check_environment.mjs --smoke-test
```

随附转换器需要 Node.js 20+ 和 Chromium、Microsoft Edge 或 Google Chrome；中文输出还需要中文字体。环境检查会报告缺项，安装脚本只复制 skill 文件。资料读取、OCR 和逐页查看 PDF 的能力由宿主工具提供；没有命令执行能力的纯聊天工具无法完成完整流程。

## 使用示例

### 精炼教材章节

上传教材或照片后，发送：

> 使用 learn-distill 整理这些高等数学第一节照片。我是初学者，计划用 60 分钟学习。按原文章节顺序保留标题、定义、公式和关键例题，解释适用条件与易错点，最后给出自检题。交付 Markdown、预览和 PDF。

查看成品格式：[函数与极限学习资料](examples/calculus-section-1.md)，含时间安排、公式、例题、图表和自检答案；[配套函数图](examples/assets/function.svg)。这是自编格式示例。

### 真实测试：FNC Julia 第二章

以下是用户使用本 skill 整理 *Fundamentals of Numerical Computation*（Julia 版）第 2 章“线性方程组”的实际测试成品，可点击查看或下载，参考内容组织、数学公式和 PDF 排版效果。

| PDF 文件 | 内容 |
| --- | --- |
| [第二章学习讲义（12 页）](examples/fnc-julia-chapter-2/fnc-ch2-notes.pdf) | 覆盖 2.1–2.10，含知识点、Julia 示例、易错点和自检，按 120 分钟学习＋60 分钟练习安排。 |
| [第二章独立习题册（19 页）](examples/fnc-julia-chapter-2/fnc-ch2-exercises.pdf) | 共 61 道大题，保留英文原题与分问，附中文提示，区分手写、编程与混合题。 |

上述 PDF 有独立的[来源与许可说明](examples/fnc-julia-chapter-2/README.md)。习题及其改编采用 CC BY-SA 4.0；讲义新增中文内容采用 CC BY-SA 4.0，原教材的 SIAM 版权保持不变。

### 整理题解或考前复习

> 使用 learn-distill，把我上传的第 3—8 题及所给题解整理成 40 分钟的复习资料。保留题干和题号，说明关键思路、步骤、结果与易错点。发现原解有错误时核算并指出，交付 Markdown、预览和 PDF。

未提供学习时间时，agent 会先询问。原文模糊或缺页的位置会明确标记；补充解释与原资料区分。时间用于安排内容深度，不代表掌握效果的保证。

生成的 Markdown 使用标准 LaTeX 数学公式和相对图片路径。使用了图片时，下载源文件也要保留配套素材；PDF 和 HTML 可直接查看。

## 参与改进

欢迎使用中文或英文交流。提交问题或修改前，请参考[贡献指南](CONTRIBUTING.zh-CN.md)。

欢迎通过 [Issues](https://github.com/Artoria67/LearnDistill/issues) 反馈读取失败、提炼遗漏、公式或排版问题，以及不同 agent 的兼容性问题。请说明使用的工具、操作系统、复现步骤和预期结果，尽量附上可公开的最小示例。

也欢迎提交 [Pull Request](https://github.com/Artoria67/LearnDistill/pulls)，改进提炼方法、转换器、示例或其他 agent 的适配。涉及代码修改时，可用以下命令验证：

```sh
npm run setup
npm run validate
npm test
npm run demo
```

`npm run demo` 会从上面的示例生成 `outputs/demo/` 下的 Markdown、素材、HTML 和 PDF。

## 许可证

项目原创代码、skill 说明、文档和自编微积分示例采用 [MIT 许可证](LICENSE)，另有声明的内容除外。MIT 允许商用、修改和再分发，也允许闭源衍生使用，条件是保留版权与许可声明。可独立安装的 skill 文件夹也包含许可证副本。

FNC PDF 和 npm 依赖保留各自条款，见[第三方声明](THIRD_PARTY_NOTICES.md)。安装本 skill 不会改变用户输入教材的权利，也不会让生成的学习资料自动采用 MIT。
