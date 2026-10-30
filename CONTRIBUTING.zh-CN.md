# 参与改进 LearnDistill · 学萃

[English](CONTRIBUTING.md) | **简体中文**

欢迎使用中文或英文交流和贡献。安装与使用示例见 [README](README.zh-CN.md)。

## 反馈问题

请在 [Issues](https://github.com/Artoria67/LearnDistill/issues) 中提供使用的 agent 与版本、操作系统、复现步骤、预期结果和实际结果。必要时附最小资料样例或报错信息，只分享可以公开的材料。

内容问题请指出原文章节或题号，以及遗漏或错误的位置。兼容性问题请分别说明文件是否成功安装、客户端是否发现并调用了 skill，以及是否生成了 PDF。

## 提交 Pull Request

1. 聚焦一个可以复现的问题或明确的改进目标。
2. 保留原资料标识，区分补充解释与来源内容。
3. 脚本保持可移植，通过安装后的 skill 路径解析资源，保留必要素材与依赖锁文件。
4. 修改安装步骤、命令或能力说明时，同步更新相关文档的中英文版本。
5. 在 PR 中说明最终行为和验证方式，明确哪些客户端或操作系统经过实际测试。

第三方示例应保留来源与适用的许可证说明。将示例加入仓库不会改变它原有的授权条款。

除明确另有声明外，对项目原创代码、skill 说明和文档的贡献采用 [MIT 许可证](LICENSE)。例外见[第三方声明](THIRD_PARTY_NOTICES.md)。仅提交你有权按所述条款分享的内容。

## 验证修改

在仓库根目录运行：

```sh
npm run setup
npm run validate
```

修改转换器或安装器时，再运行：

```sh
npm test
npm run demo
```

测试需要 Chromium 系浏览器，中文 PDF 示例还需要中文字体。影响排版的修改应检查生成后的 PDF 各页。仅修改文档时，使用 `npm run validate` 检查链接与脚本语法。

## 文档与发布

- 英文入口：[README.md](README.md)。
- 中文入口：[README.zh-CN.md](README.zh-CN.md)。
- 维护者说明：[GitHub 仓库设置与发布指南](docs/github-setup.zh-CN.md)。

文档语言不决定生成资料的语言；skill 按用户指定的语言输出。
