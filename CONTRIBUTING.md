# Contributing to LearnDistill

**English** | [简体中文](CONTRIBUTING.zh-CN.md)

Contributions and discussions in English or Chinese are welcome. Start with the [README](README.md) for installation and examples.

## Report a problem

Open an [issue](https://github.com/Artoria67/LearnDistill/issues) with your agent and version, operating system, reproduction steps, expected behavior and actual result. Include a small source sample or error message when useful. Share only materials you can make public.

For content problems, identify the original section or exercise and the incorrect or missing part. For compatibility problems, distinguish a successful file installation from actual skill discovery, invocation and PDF generation in the client.

## Send a pull request

1. Keep the change focused on a reproducible problem or a clear improvement.
2. Preserve original source identifiers and distinguish supplementary explanations from source content.
3. Keep scripts portable and resolve resources relative to the installed skill. Include required assets and dependency lockfiles.
4. When changing installation steps, commands or advertised capabilities, update both language versions of the affected documentation.
5. Describe the resulting behavior and how you checked it in the PR. State which clients or operating systems you actually tested.

Retain attribution and applicable license notices for third-party examples. Adding an example does not change its original licensing terms.

## Validate changes

From the repository root:

```sh
npm run setup
npm run validate
```

For converter or installer changes, also run:

```sh
npm test
npm run demo
```

Tests need a Chromium-based browser; Chinese PDF examples also need Chinese fonts. Review generated PDF pages when a change affects layout. For documentation-only changes, check links and script syntax with `npm run validate`.

## Documentation and releases

- English entry point: [README.md](README.md).
- Chinese entry point: [README.zh-CN.md](README.zh-CN.md).
- Maintainer instructions: [GitHub setup and release guide](docs/github-setup.md).

The documentation language does not determine the language of generated notes: the skill follows the user's requested language.
