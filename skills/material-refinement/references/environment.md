# 环境检查与安装

## 检查

`scripts/check_environment.mjs` 无第三方包也能运行，只读取与本任务相关的软件路径，输出 JSON。它不安装软件、不修改编辑器设置、不改变权限。若连 Node.js 也不可用，先用当前 shell 检查已有编辑器和 PDF 工具，询问是否安装 Node.js 或采用现有转换器。

报告区分：

- `editors`：已找到的 VS Code、VSCodium、Typora、Obsidian、MarkText、Zettlr 等。VS Code 自带基础预览，无须额外安装预览插件。检测到的可选扩展仅供参考。
- `renderer`：Node 版本、Markdown/KaTeX/Playwright 依赖、本地 Chromium/Edge/Chrome，以及中文字体候选。文件存在不保证程序能启动。
- `recommendations`：需要 agent 判断并询问的缺项。编辑器安装不是 PDF 生成的先决条件。

依赖和浏览器齐备时，可运行 `node <skill-dir>/scripts/check_environment.mjs --smoke-test`，临时生成含中文与公式的小 PDF，确认转换器实际可运行。临时文件自动清理；这个自检不能替代最终资料的内容检查和逐页视觉检查。

## 安装分支

1. 已有可用编辑/预览方案：继续处理；不要安装其他编辑器来满足某个产品名称。
2. 没有编辑/预览方案：简短询问是否安装，说明建议产品及用途，例如“未找到 Markdown 编辑器。是否安装 VS Code 方便查看和修改源文件？拒绝也可继续生成 PDF。”等待用户回答。
3. 用户同意后，先确认系统和已有包管理器，使用可信软件源帮助安装，只安装获准组件。VS Code 内置预览已够用；额外扩展只有用户需要其功能时才安装。安装后再次检测。
4. 用户拒绝编辑器/插件：继续 Markdown → PDF，以生成的 HTML 或对话内容作为预览；不要要求用户改用在线转换站。
5. 本转换器缺依赖：获得安装同意后，在 skill 目录运行 `npm ci --omit=dev`。默认使用已安装的 Chromium、Edge 或 Chrome；可通过 `--browser <executable>` 指定。只有确实缺浏览器且用户同意时才安装 Chromium 等组件。
6. 用户不允许安装转换依赖：使用可用的 Pandoc + TeX、Typora 导出、浏览器打印、ReportLab 等本地方法。根据工具能力逐项核对公式/图表；不能静默丢弃它们。

用户说“允许联网/写代码”不等于当前宿主已开放相应权限。遇到实际权限拒绝时，用宿主支持的方式请求本次所需权限；不能修改全局安全设置或绕过审批。不要预先索要与任务无关的广泛权限。
