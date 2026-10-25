import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PDFDocument } from 'pdf-lib';
import { buildHtml, isWithin, parseArguments, renderMarkdownFile } from '../skills/material-refinement/scripts/render_pdf.mjs';
import { detectEditors, findBrowser } from '../skills/material-refinement/scripts/runtime.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skill = path.join(root, 'skills', 'material-refinement');
const require = createRequire(path.join(skill, 'package.json'));
const { chromium } = require('playwright-core');
const browser = findBrowser({ chromiumExecutable: chromium.executablePath() });

async function scratch(context) {
  const base = path.join(root, 'tmp');
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, 'renderer-test-'));
  context.after(async () => {
    assert.ok(isWithin(base, directory) && directory !== base, 'Cleanup must stay inside the test scratch directory.');
    await fs.rm(directory, { recursive: true, force: true });
  });
  return directory;
}

test('CLI accepts spaces, apostrophes and Unicode in paths and creates a parseable multi-page PDF', async context => {
  assert.ok(browser, 'Tests require an installed Chromium, Edge or Chrome.');
  const directory = path.join(await scratch(context), "learner's 中文 notes");
  await fs.cp(path.join(root, 'examples'), directory, { recursive: true });
  const input = path.join(directory, 'calculus-section-1.md');
  const result = JSON.parse(execFileSync(process.execPath, [path.join(skill, 'scripts', 'render_pdf.mjs'), input,
    '--browser', browser, '--title', '第一节 函数与极限', '--lang', 'zh-CN'], { encoding: 'utf8', windowsHide: true }));
  assert.equal(result.ok, true);
  assert.equal(result.images, 1);
  assert.ok(result.mathExpressions >= 20);
  const pdf = await PDFDocument.load(await fs.readFile(result.pdf));
  assert.ok(pdf.getPageCount() >= 2, 'The sample must exercise page breaks.');
  assert.equal(pdf.getTitle(), '第一节 函数与极限');
  for (const page of pdf.getPages()) {
    assert.ok(Math.abs(page.getWidth() - 595.28) < 2);
    assert.ok(Math.abs(page.getHeight() - 841.89) < 2);
  }
  assert.equal(await fs.readFile(input, 'utf8'), await fs.readFile(path.join(root, 'examples', 'calculus-section-1.md'), 'utf8'));
});

test('standalone HTML displays four math delimiters, a real image and a table without network requests', async context => {
  const directory = await scratch(context);
  await fs.cp(path.join(root, 'examples', 'assets'), path.join(directory, 'assets'), { recursive: true });
  let requests = 0;
  const server = http.createServer((_request, response) => { requests++; response.end('unexpected'); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  context.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/probe`;
  const markdown = String.raw`# 离线预览

行内 $x^2$ 和 \(y+1\)。

$$\frac{1}{2}$$

\[a+b=c\]

| 甲 | 乙 |
| --- | --- |
| 中文 | English |

![图1](assets/function.svg)

` + `<script>window.previewInjected=true;fetch('${url}')</script>\n\n[来源](${url})`;
  const result = buildHtml({ markdown, sourceDirectory: directory });
  assert.equal(result.mathExpressions, 4);
  const file = path.join(directory, 'preview.html');
  await fs.writeFile(file, result.html);
  const instance = await chromium.launch({ executablePath: browser, headless: true });
  context.after(() => instance.close());
  const page = await instance.newPage();
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator('main .katex').count(), 4);
  assert.equal(await page.locator('main table tbody tr').count(), 1);
  assert.equal(await page.locator('main script').count(), 0);
  assert.equal(await page.evaluate(() => window.previewInjected), undefined);
  assert.equal(await page.locator('main img').evaluate(image => image.complete && image.naturalWidth > 0), true);
  assert.equal(await page.locator('main .figure-caption').textContent(), '图1');
  assert.ok(await page.evaluate(() => [...document.fonts].some(font => font.status === 'loaded')));
  assert.equal(requests, 0);
});

test('a long table produces a PDF with multiple pages', async context => {
  const directory = await scratch(context);
  const input = path.join(directory, 'table.md');
  const rows = Array.from({ length: 90 }, (_value, index) => `| ${index + 1} | 学习内容与适用条件 ${index + 1} |`).join('\n');
  await fs.writeFile(input, `# 跨页表格\n\n| 编号 | 内容 |\n| --- | --- |\n${rows}\n`);
  const result = await renderMarkdownFile({ input, browser });
  const pdf = await PDFDocument.load(await fs.readFile(result.pdf));
  assert.ok(pdf.getPageCount() >= 3);
});

test('invalid formulas fail instead of becoming a successful PDF', async context => {
  const directory = await scratch(context);
  const input = path.join(directory, 'invalid.md');
  await fs.writeFile(input, '# 公式错误\n\n$\\notarealcommand{x}$');
  await assert.rejects(renderMarkdownFile({ input }), /Invalid formula/);
  await assert.rejects(fs.access(path.join(directory, 'invalid.pdf')));
  await assert.rejects(fs.access(path.join(directory, 'invalid.html')));
});

test('missing and remote images fail explicitly', async context => {
  const directory = await scratch(context);
  assert.throws(() => buildHtml({ markdown: '![missing](missing.png)', sourceDirectory: directory }), /Image not found/);
  assert.throws(() => buildHtml({ markdown: '![remote](https://example.com/image.png)', sourceDirectory: directory }), /local image/);
});

test('image traversal and symlinks cannot read outside the source directory', async context => {
  const directory = await scratch(context);
  const notes = path.join(directory, 'notes');
  const external = path.join(directory, 'external');
  await fs.mkdir(notes);
  await fs.mkdir(external);
  await fs.writeFile(path.join(external, 'image.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  assert.throws(() => buildHtml({ markdown: '![outside](../external/image.svg)', sourceDirectory: notes }), /outside/);
  await fs.symlink(external, path.join(notes, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => buildHtml({ markdown: '![linked](linked/image.svg)', sourceDirectory: notes }), /outside/);
});

test('SVG script and external resource references are refused; internal references remain usable', async context => {
  const directory = await scratch(context);
  for (const [name, svg] of [
    ['script.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
    ['remote.svg', '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.com/a.png"/></svg>'],
  ]) {
    await fs.writeFile(path.join(directory, name), svg);
    assert.throws(() => buildHtml({ markdown: `![unsafe](${name})`, sourceDirectory: directory }), /passive/);
  }
  await fs.writeFile(path.join(directory, 'safe.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"/></defs><rect width="20" height="20" fill="url(\'#g\')"/></svg>');
  assert.equal(buildHtml({ markdown: '![safe](safe.svg)', sourceDirectory: directory }).assets.length, 1);
});

test('unconverted diagram blocks and empty notes are refused', async context => {
  const directory = await scratch(context);
  assert.throws(() => buildHtml({ markdown: '```mermaid\ngraph LR; A-->B\n```', sourceDirectory: directory }), /Unrendered/);
  assert.throws(() => buildHtml({ markdown: '  ', sourceDirectory: directory }), /empty/);
});

test('overflow is reported and previous successful outputs are preserved', async context => {
  const directory = await scratch(context);
  const input = path.join(directory, 'wide.md');
  const pdf = path.join(directory, 'wide.pdf');
  const html = path.join(directory, 'wide.html');
  await fs.writeFile(input, `# Too wide\n\n$$${'x+'.repeat(150)}x$$\n`);
  await fs.writeFile(pdf, 'previous PDF');
  await fs.writeFile(html, 'previous HTML');
  await assert.rejects(renderMarkdownFile({ input, browser }), /exceeds printable width/);
  assert.equal(await fs.readFile(pdf, 'utf8'), 'previous PDF');
  assert.equal(await fs.readFile(html, 'utf8'), 'previous HTML');
});

test('corrupt image data cannot silently disappear from the PDF', async context => {
  const directory = await scratch(context);
  await fs.writeFile(path.join(directory, 'broken.png'), 'not a PNG');
  const input = path.join(directory, 'broken.md');
  await fs.writeFile(input, '# Image\n\n![broken](broken.png)');
  await assert.rejects(renderMarkdownFile({ input, browser }), /decode|EncodingError|source image/i);
  await assert.rejects(fs.access(path.join(directory, 'broken.pdf')));
});

test('invalid output extensions and unknown CLI flags fail without changing the Markdown', async context => {
  const directory = await scratch(context);
  const input = path.join(directory, 'notes.md');
  await fs.writeFile(input, '# Keep source');
  await assert.rejects(renderMarkdownFile({ input, output: input }), /Output paths/);
  assert.equal(await fs.readFile(input, 'utf8'), '# Keep source');
  assert.throws(() => parseArguments(['notes.md', '--unknown']), /Unknown option/);
  assert.throws(() => parseArguments(['notes.md', '--output']), /Missing value/);
});

test('an existing VS Code provides preview without requiring extensions; no editor is also detectable', async context => {
  const directory = await scratch(context);
  await fs.writeFile(path.join(directory, process.platform === 'win32' ? 'code.cmd' : 'code'), '');
  const editors = detectEditors({ env: { PATH: directory }, platform: process.platform });
  assert.equal(editors.find(editor => editor.name === 'VS Code').markdownPreview, 'built-in');
  assert.deepEqual(detectEditors({ env: { PATH: '' }, platform: 'win32' }), []);
});

test('environment inspection still runs when the conversion packages have not been installed', async context => {
  const directory = await scratch(context);
  await fs.cp(path.join(skill, 'scripts'), path.join(directory, 'scripts'), { recursive: true });
  const report = JSON.parse(execFileSync(process.execPath, [path.join(directory, 'scripts', 'check_environment.mjs')],
    { encoding: 'utf8', windowsHide: true, env: { ...process.env, NODE_PATH: '' } }));
  assert.equal(report.renderer.dependencies['markdown-it'], false);
  assert.equal(report.renderer.readyForSmokeTest, false);
  assert.equal(report.smokeTest.status, 'not-run');
});
