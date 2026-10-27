# LearnDistill · 学萃

**English** | [简体中文](README.zh-CN.md)

**Turn textbooks, lecture notes and worked solutions into study-ready materials that fit your available time and background.**

Provide a PDF, document, photo or webpage link, then tell your agent what you want to learn and how much time you have. Get **editable Markdown, an HTML preview and a PDF**, with original section titles, exercise numbers, formulas, figures and necessary conditions preserved for reference.

Built using the [Agent Skills format](https://agentskills.io/specification) for agents with file access and command execution. Installation instructions cover Codex, Claude Code, Cursor, GitHub Copilot in VS Code, DeepSeek Harness, WorkBuddy and TRAE.

## Install

### Give the repository link to your agent

For agents that can access a repository and copy files, send:

```text
Install the skills/learn-distill skill from
https://github.com/Artoria67/LearnDistill
into the project-level skills directory supported by this agent.
Copy the entire skill folder, including scripts, references, assets and
dependency files. Check the environment and install conversion dependencies
as needed. Confirm that SKILL.md can be read and the environment check runs.
```

The agent needs access to the repository and permission to write to the destination. Pasting a link does not install a skill in every tool. For WorkBuddy, import a local skill package using the upload workflow below.

### Use the installer

Install [Node.js 20 or later](https://nodejs.org/), then download the repository and run:

```sh
git clone https://github.com/Artoria67/LearnDistill.git learn-distill
cd learn-distill
node scripts/install.mjs --agent codex --scope user
```

The built-in `--agent` choices are `codex`, `claude-code`, `cursor` and `copilot`. Replace `codex` with the appropriate identifier to install for your user account. To install for one project:

```sh
node scripts/install.mjs --agent claude-code --scope project --project-dir "../my-study-project"
```

You can also copy the entire `skills/learn-distill/` folder to a directory below. The built-in `--agent` choices use their listed paths; use `--dest` for other directories. The installer stops if a skill folder already exists, preserving existing files. WorkBuddy uses package upload.

| Tool | Project directory or import entry | User directory | Invocation |
| --- | --- | --- | --- |
| [Codex](https://developers.openai.com/codex/skills/) | `.agents/skills/` | `~/.agents/skills/` | `$learn-distill` or natural language |
| [Claude Code](https://code.claude.com/docs/en/skills) | `.claude/skills/` | `~/.claude/skills/` | `/learn-distill` or natural language |
| [Cursor](https://cursor.com/docs/skills) | `.cursor/skills/` | `~/.cursor/skills/` | Select from the `/` menu or use natural language |
| [GitHub Copilot in VS Code](https://code.visualstudio.com/docs/agent-customization/agent-skills) | `.github/skills/` | `~/.copilot/skills/` | Select from the `/` menu or use natural language |
| [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill-filesystem/README.md) | `.dsh/skills/` | `~/.dsh/skills/` by default | `/learn-distill` or natural language |
| [WorkBuddy](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market) | Skills → Add skill → Upload skill | Managed by the client | Enable the installed skill, then request it by name |
| [TRAE](https://docs.trae.cn/ide_skills) | `.trae/skills/` | China edition: `~/.trae-cn/skills/` | Ask the agent to use `learn-distill` |

Each directory should contain `learn-distill/SKILL.md`. `~` means your home directory. Refresh skills or start a new session as required by your tool. If `DSH_HOME` is set, DeepSeek Harness uses its `skills/` subdirectory for user skills.

### DeepSeek Harness, TRAE and WorkBuddy

**DeepSeek Harness / TRAE:** after downloading the repository, choose the command for your tool to install into a project:

```sh
# DeepSeek Harness
node scripts/install.mjs --dest "../my-study-project/.dsh/skills"

# TRAE
node scripts/install.mjs --dest "../my-study-project/.trae/skills"
```

TRAE also supports local import through Settings → Skills and Commands → Create (Chinese UI: 设置 → 技能与命令 → 创建). Keep all skill resources; importing only `SKILL.md` does not include the converter. To share a project's `.agents/skills/` directory, enable the corresponding import setting in TRAE (启用 .agents 技能目录).

**WorkBuddy:** download the repository and package `skills/learn-distill/` as a local skill ZIP, preserving `SKILL.md`, scripts, references, styles and dependency manifests. Exclude `node_modules/`. In the Skills panel, choose Add skill → Upload skill (Chinese UI: 专家·技能·连接器 → 技能 → 添加技能 → 上传技能). Confirm it is enabled in the installed list, then ask “Use learn-distill to organize these materials.” Conversation-based installation covers marketplace skills; use local upload for this repository.

For other Agent Skills-compatible tools, copy the same folder or specify their skills directory:

```sh
node scripts/install.mjs --dest "/path/to/your-agent/skills"
```

Paths are based on the linked official documentation. Standalone installation and conversion have been tested; discovery and invocation have not been tested in every client. The Codex plugin metadata is an optional distribution entry point.

### Prepare PDF conversion

Run these commands **inside the installed `learn-distill` directory**:

```sh
node scripts/check_environment.mjs
npm ci --omit=dev --ignore-scripts
node scripts/check_environment.mjs --smoke-test
```

The bundled converter needs Node.js 20+, Chromium, Microsoft Edge or Google Chrome, and fonts for the output language. The environment check reports missing components; the installer only copies skill files. Source reading, OCR and PDF page inspection depend on the host agent. A chat tool without command execution cannot complete the full workflow.

## Examples

### Refine a textbook section

Upload your materials and ask:

> Use learn-distill to organize these calculus-section photos for a beginner. I have 60 minutes. Keep the original section order, headings, definitions, formulas and key worked examples. Explain conditions and common mistakes, add self-check questions, and deliver Markdown, a preview and a PDF.

See the [calculus study-note example](examples/calculus-section-1.md) and its [function plot](examples/assets/function.svg). This is an authored format sample in Chinese, with a study schedule, formulas, examples, figures and self-check answers.

### Real usage: FNC Julia Chapter 2

These Chinese-language PDFs were produced in a user test of this skill on Chapter 2, “Linear systems of equations,” from *Fundamentals of Numerical Computation* (Julia edition). Open them to inspect organization, mathematical notation and PDF layout.

| PDF | Contents |
| --- | --- |
| [Chapter 2 study guide, 12 pages](examples/fnc-julia-chapter-2/fnc-ch2-notes.pdf) | Sections 2.1–2.10, concepts, Julia examples, common mistakes and self-checks, with 120 minutes of study plus 60 minutes of practice. |
| [Chapter 2 exercise booklet, 19 pages](examples/fnc-julia-chapter-2/fnc-ch2-exercises.pdf) | 61 exercises with original English statements and subparts, Chinese guidance, and handwritten, programming or mixed-task labels. |

### Organize solutions or revision notes

> Use learn-distill to turn exercises 3–8 and their supplied solutions into 40 minutes of revision material. Preserve the statements and numbering. Explain the key approach, steps, results and common mistakes. Check and flag errors in the supplied solutions. Deliver Markdown, a preview and a PDF.

If you omit a study-time budget, the agent asks for one first. Unclear or missing source material is marked, and additional explanations are distinguished from the source. Time budgets guide the depth of the notes; they do not guarantee mastery.

Generated Markdown uses LaTeX math and relative image paths. When downloading Markdown with images, keep its accompanying assets. PDF and HTML files can be viewed directly.

## Contribute

Issues and pull requests in **English or Chinese** are welcome. See the [contribution guide](CONTRIBUTING.md).

Report reading failures, missing content, formula or layout problems, and agent compatibility issues through [Issues](https://github.com/Artoria67/LearnDistill/issues). Include your agent, operating system, reproduction steps and expected result, preferably with a small example that can be shared publicly.

[Pull requests](https://github.com/Artoria67/LearnDistill/pulls) can improve refinement methods, the converter, examples, documentation or agent compatibility. For code changes, run:

```sh
npm run setup
npm run validate
npm test
npm run demo
```

`npm run demo` generates Markdown, assets, HTML and PDF in `outputs/demo/` from the example.
