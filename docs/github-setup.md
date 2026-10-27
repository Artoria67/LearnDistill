# GitHub setup and release guide

**English** | [简体中文](github-setup.zh-CN.md)

For LearnDistill · 学萃. GitHub's official instructions were checked on **2026-10-27**. Availability and labels can vary with your account plan and GitHub updates. These are recommended settings, not changes already applied to the remote repository.

## 1. Prepare a releasable version

Verified snapshot: the remote repository is `Artoria67/LearnDistill`, its visibility is **Private**, and its default branch is `main`. The local project has no root `LICENSE` or GitHub Actions workflow yet. Local changes must be committed and pushed before they appear on GitHub.

Work in this order:

1. Choose a license for the code and skill instructions, then add a root `LICENSE`. If the goal is broad reuse, modification and redistribution, consider [MIT](https://choosealicense.com/licenses/mit/). This is a recommendation; the project has not adopted it.
2. Preserve third-party attribution and licensing. The FNC exercise PDF includes its own source and CC BY-SA 4.0 notice; a license chosen for this project's code does not replace those terms.
3. Check both languages' installation instructions and example links, then review the commits and history you intend to publish. `.gitignore` does not remove files already committed.
4. Run the checks below, review the changes, then commit and push to the intended release branch.

```sh
npm run setup
npm run validate
npm test
git diff --check
git status --short
```

PDF tests need a Chromium-based browser; Chinese examples also need Chinese fonts. Documenting an installation path is different from testing discovery and invocation in that client. Keep release claims specific to what was actually verified.

Public visibility and open-source licensing are separate decisions. The maintainer must explicitly select a license. See [GitHub's licensing guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository).

## 2. Name, description and About

**Current repository name: `LearnDistill`.** The GitHub repository has already been renamed to match the project brand.

Update an existing local clone to use the current repository address:

```sh
git remote set-url origin https://github.com/Artoria67/LearnDistill.git
git remote -v
```

Repository, issue and PR links in both READMEs, the contribution guides and installation text use the current address. If the repository is renamed again, update these links after the rename succeeds. See [GitHub's rename instructions](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository).

On the repository home page, open **About → gear icon** to set Description, Website and Topics. Description is one field, not an automatic locale switch. Use the combined bilingual version below.

**English description:**

```text
Turn textbooks, lecture notes and worked solutions into study-ready Markdown and PDF with a portable Agent Skill.
```

**Chinese description:**

```text
学萃：把教材、讲义和题解，按学习时间整理成可编辑的 Markdown 与 PDF；面向多种 Agent 工具。
```

**Recommended combined About description:**

```text
Study-ready Markdown & PDF from textbooks and notes, with a portable Agent Skill. 学萃：按学习时间精炼教材、讲义和题解。
```

Leave Website empty until there is a real documentation site. The README is already a usable entry point.

## 3. Topics, version tags and issue labels

- **Topics** classify a repository by purpose and ecosystem to help people discover it.
- **Git tags**, such as `v0.1.0`, identify versions for releases and reproducibility.
- **Issue labels**, such as `bug`, `documentation` and `good first issue`, organize feedback and contributions.

Add the following relevant topics individually under About → gear icon → Topics, then save:

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

GitHub permits at most 20 topics, each no longer than 50 characters, using lowercase letters, numbers and hyphens. Topic names are public even when the repository is private. Use accurate categories rather than unrelated popular keywords. See [GitHub's topic documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics).

## 4. Settings → General

Recommendations for this small, individually maintained project:

| Area or option | Recommendation | Reason |
| --- | --- | --- |
| Features → Issues | Enable | One place for defects and compatibility feedback. |
| Features → Discussions | Enable when a Q&A community is useful | Prepare a welcome post and FAQ first; it can wait until you can maintain it. |
| Features → Wiki | Leave disabled initially | Keep bilingual documentation in the repository. |
| Features → Projects | Enable when there is real scheduling work | Issues are sufficient at the beginning. |
| Pull Requests → Allow squash merging | Enable | One commit per PR makes changes easier to inspect and revert. |
| Allow merge commits / Allow rebase merging | Can be disabled initially | Keep one main merge method. |
| Automatically delete head branches | Enable | Clean up merged working branches. |
| Default branch | Keep `main` | Match the first release's target branch. |

These are maintenance choices, not search-ranking switches. See the official instructions for [Discussions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/enabling-or-disabling-github-discussions-for-a-repository) and [squash merging](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/configuring-commit-squashing-for-pull-requests).

## 5. Protect the main branch

Under **Settings → Branches → Add classic branch protection rule**, create a rule for `main`. Protected branches are available for public repositories on GitHub Free; private-repository availability depends on the plan, so this may need to be configured after publication.

| Option | Recommendation |
| --- | --- |
| Branch name pattern | `main` |
| Require a pull request before merging | Enable to review contributions through PRs. |
| Require approvals | Leave unchecked for a solo maintainer; consider one approval when another maintainer joins. |
| Require conversation resolution before merging | Enable. |
| Require status checks to pass before merging | Select real check names only after CI exists and has run successfully. |
| Allow force pushes | Leave unchecked. |
| Allow deletions | Leave unchecked. |
| Do not allow bypassing the above settings | Can remain unchecked initially so the admin can recover from a misconfiguration. |

There is no CI workflow yet. Do not require a check that does not exist, or another person's approval when there is no other maintainer. See [branch protection setup](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule).

## 6. Actions and dependency alerts

Under **Settings → Actions → General**:

- Set Workflow permissions to **Read repository contents and packages permissions**. Grant narrowly scoped write permissions in a particular workflow only when it needs them.
- Keep first-time contributor approval for fork workflows. There is no initial need to allow Actions to create and approve PRs.
- When CI is added, prepare the runner's browser and fonts as well as running `npm run setup`, `npm run validate` and `npm test`.

Under **Settings → Advanced Security**, enable available Dependabot alerts. These report vulnerable dependencies; they do not certify the converter or learning content. See [Actions settings](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository) and [Dependabot alerts](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configure-dependabot-alerts).

## 7. Make the repository public and add a social preview

After documentation, examples and licensing are ready and pushed, use **Settings → General → Danger Zone → Change repository visibility**, choose Public, verify the repository name and confirm. Review Git history and Actions logs beforehand because they also become public. See [visibility settings](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility).

Then use **Settings → General → Social preview → Edit → Upload an image**:

- Recommended size: **1280 × 640**; PNG, JPG or GIF, **under 1 MB**.
- Include `LearnDistill · 学萃`, one short capability statement and a real output screenshot. Keep it legible as a thumbnail.
- Prepare the image beforehand. GitHub documents first-time upload for public repositories; private repositories support upload only when an image was uploaded previously. This step may therefore have to wait until publication.

The image affects how shared repository links appear on social platforms. See [social preview requirements](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview).

## 8. Create the first release

The package and plugin versions are currently `0.1.0`. Once that version is ready, open **Releases → Draft a new release**:

1. Create tag `v0.1.0` targeting the verified `main` commit that has been pushed.
2. Use a title such as `LearnDistill v0.1.0 — Study-ready notes / 学萃首发`.
3. Describe the capability, installation, examples and known limits in both languages. Name the systems and clients actually tested; installation instructions alone are not evidence of client testing.
4. Optionally attach a ZIP containing the complete skill folder for local import. Keep resources and dependency manifests; omit `node_modules/`, private source materials and temporary outputs.
5. Save a draft until everything is ready, then publish. Mark it as a pre-release if it is still experimental.

See [release instructions](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository). Making a repository public does not automatically list the skill in agent marketplaces.

## 9. Reach relevant users

Settings improve presentation and discoverability; they do not guarantee exposure or stars. Prioritize:

1. **Reproducible installation.** Ask users of different systems and agents to install from a clean directory, report actual failures and help resolve them.
2. **Visible results.** Show a source-material screenshot beside an output screenshot, or record a 30–60 second demo explaining the input, time budget and result. Keep the PDF examples linked from the README.
3. **One concrete use case.** “Turn a numerical-computation chapter into a two-hour study guide” communicates more than a generic claim of a universal learning tool.
4. **Relevant communities.** Follow community rules when sharing bilingual introductions, installation steps and examples in the agent and learning communities you use. Consider directory submissions after the GitHub workflow works.
5. **Actionable contributions.** For example, ask for a macOS installation and PDF-conversion report with tool versions, and label a suitable concrete task `good first issue`.

After publication, use **Insights → Traffic** for recent visitors, full clones and referrals; GitHub's view covers the previous 14 days. Review installation feedback and reproducibility each week, not just stars. See [repository traffic](https://docs.github.com/en/repositories/viewing-activity-and-data-for-your-repository/viewing-traffic-to-a-repository).

## 10. Keep both languages current

- [English README](../README.md) is the default GitHub entry point; [Chinese README](../README.zh-CN.md) is a complete counterpart. They link to each other.
- Update both versions when installation, requirements or capability claims change. Wording may differ, but facts and procedures should agree.
- Contribution guides are available in [English](../CONTRIBUTING.md) and [Chinese](../CONTRIBUTING.zh-CN.md). Issues and PRs accept either language.
- Label example languages accurately. The current FNC PDFs contain Chinese explanations; no English PDF edition is advertised.

Order of work: **license and working installation → clear bilingual entry points → Description/Topics → first release → demos and feedback → broader client testing.**
