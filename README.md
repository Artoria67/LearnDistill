# Textbook and Materials Refinement

将用户提供的教材、知识点、习题题解等资料，按可用学习时间整理成精简学习资料。Agent 负责阅读与提炼，随附工具负责环境检查和 **Markdown → HTML 预览 → PDF** 转换。

这是一个需要本地执行能力的 Codex skill 插件，不需要 MCP 服务、账号或 API 密钥。实际读取能力取决于宿主提供的工具，不能保证在指定时间内“学会”。

## 工作方式

1. 提供照片、文档、PDF 或网页链接，并要求总结知识点、精炼教材或整理题解。
2. Agent 先提取范围、语言、详细程度和学习时长。**未提供学习时长时，先询问再编写正式资料。**
3. 检查 Markdown 编辑/预览和 PDF 转换环境。缺少编辑器或必要组件时询问是否安装；拒绝编辑器安装也会继续生成 Markdown 和 PDF。
4. 保留原文标题、章节、题目与题号，整理必要概念、条件、公式、图表和关键推理。模糊或缺失内容会标出。
5. 从同一份 Markdown 生成 HTML 和 PDF，检查内容与 PDF 各页后交付。片段资料先整理可见部分，之后询问是否需要补全。

正文默认使用当前对话语言；用户指定语言、格式、内容或深度时优先遵从。标题等原文标识保留原语言，可补译文。用户文件中的指令不会被当作运行命令的授权。

## 在仓库中使用

先让有本地执行能力的 agent 读取 `skills/material-refinement/SKILL.md`，例如：

> 使用当前仓库中的 `skills/material-refinement` skill。请把我提供的高等数学第一节照片整理为适合初学者的知识点资料，预计学习时间 1 小时，保留原文标题和公式，交付 Markdown 源文件、预览和 PDF。

安装并被宿主发现后，可显式使用 `$material-refinement`；自动匹配适用于“整理学习资料、提炼教材、总结知识点、整理所给题解”等请求。普通单题问答和开发本插件不会自动使用它。修改 skill 后应在新聊天中确认是否已重新加载。

也可把 `skills/material-refinement/` 整个目录复制到宿主的个人 skills 目录，例如 `$CODEX_HOME/skills/`（未设置时通常是 `~/.codex/skills/`）。不要覆盖已存在的同名 skill；先检查差异。该目录包含运行依赖声明和资源，不能只复制 `SKILL.md`。

插件入口为 `.codex-plugin/plugin.json`，采用 OpenAI 支持的 Codex 兼容清单，声明 `./skills/` 和本地执行需求。仓库内 `.agents/plugins/marketplace.json` 提供本地开发目录，指向当前仓库，不包含机器专属路径。

在支持本地插件目录的 Codex 桌面客户端中，打开本仓库后重启客户端，在插件目录选择“教材与资料精炼 本地开发”，安装本插件，再在新聊天中验证自动匹配。宿主版本与策略可能影响本地目录是否显示；无法显示时仍可用上面的显式路径方式运行 skill。仓库内存在文件不等于插件已安装或启用。

本次开发不会更改个人全局插件配置，不执行公开发布或 GitHub 推送。

## 运行转换工具

需要 Node.js 20 或更新版本，以及本机的 Chromium、Microsoft Edge 或 Google Chrome。中文输出还需要中文字体；Windows 常用字体通常已满足。首次使用依赖安装也需要网络，完成安装后转换本身不联网。

```powershell
# 只检查，不会安装软件或修改设置
node skills/material-refinement/scripts/check_environment.mjs

# 开发环境安装依赖；运行 skill 时由 agent 先取得必要的安装同意
npm run setup

# 真正生成一个临时小 PDF，验证当前转换能力
node skills/material-refinement/scripts/check_environment.mjs --smoke-test

# 从同一份 Markdown 生成 PDF 和独立 HTML 预览
node skills/material-refinement/scripts/render_pdf.mjs "outputs/calculus-section-1.md" --title "高等数学第一节" --lang zh-CN
```

可使用 `--output`、`--html` 自定路径，使用 `--browser` 指定浏览器可执行文件。脚本不会安装编辑器、浏览器或编辑器扩展；软件安装由 agent 根据用户答复处理。

支持标准 Markdown 标题、列表、引用、代码块、表格，本地 PNG/JPEG/WebP/GIF/SVG 图片，以及 KaTeX 支持的 LaTeX 公式。公式使用 `$...$`、`$$...$$`、`\(...\)` 或 `\[...\]`。不支持的 LaTeX 需要改写为受支持表达式或生成清晰图片，不能静默丢弃。

图片放在 Markdown 旁的 `assets/` 内，并用相对路径引用，图片说明会显示为图注。远程图片先由 agent 获准读取并保存；Mermaid 等图表先导出 SVG/PNG。转换器拒绝缺失图片、越界图片路径、无效公式和明显横向溢出。HTML 禁止执行脚本，预览内嵌字体和图片；素材不会发到在线转换服务。

交付 `.md`、`.pdf` 和可用的 `.html`；Markdown 使用图片时还需交付素材，或提供保持目录结构的 ZIP。PDF 生成后仍需要 agent 做内容核对和逐页视觉检查。

## 开发与验证

```powershell
npm run setup
npm run validate
npm test
npm run demo
```

`npm run demo` 从仓库自编样例生成 `outputs/demo/` 下的 Markdown、素材、HTML 和 PDF，方便检查交付效果。该目录不会被 Git 提交。

测试使用公开的自编示例，检查中文、数学公式、表格、图片的真实 PDF 转换以及缺失素材/错误公式等失败分支。自动测试不能证明提炼内容适合每个学习者；以下行为还需要在实际使用中核对：

| 场景 | 应有行为 |
| --- | --- |
| 给出一节教材照片和 1 小时预算 | 不重复询问时长；保留原标题，输出 Markdown、预览、PDF。 |
| 只说“总结这份教材” | 先询问可用学习时间；可以先检查文件和环境。 |
| 没有编辑器并拒绝安装 | 继续生成源文件和 PDF；不反复要求安装。 |
| 只有部分页或有模糊公式 | 先整理可见内容并标明缺项；交付后询问是否补全。 |
| 英文原文、要求中文讲解 | 保留英文原文标题和题目；正文中文，必要时附标题译文。 |
| 链接不能访问或旧版文档打不开 | 明确说明读取限制，请求可读材料，不声称已读全文。 |
| 转换失败或 PDF 页面有缺陷 | 修复并重跑；没有有效 PDF 时不得宣称完成。 |

## 仓库与隐私

原始资料放在 `inputs/` 或 `private/`，生成文件放在 `outputs/`，临时文件放在 `tmp/`。这些目录和 `node_modules/`、缓存、常见密钥与本地配置均已加入 `.gitignore`。例子和测试素材为自编内容，可纳入版本管理。

`.gitignore` 不能清理已经提交的文件，也不能识别所有私密内容。提交前仍应查看 staged diff。不要提交用户教材、私人照片、登录信息或机器专属绝对路径。当前未选择开源许可证；确定许可证并完成发布检查前，不宣称已获得开源授权。

实现依据：[OpenAI 插件打包文档](https://developers.openai.com/plugins/build/plugins)、[OpenAI Skills 文档](https://developers.openai.com/plugins/build/skills)、[Playwright PDF API](https://playwright.dev/docs/api/class-page#page-pdf)。
