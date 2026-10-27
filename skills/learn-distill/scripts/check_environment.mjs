import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { detectEditors, detectMarkdownExtensions, detectChineseFonts, findBrowser } from './runtime.mjs';

const require = createRequire(import.meta.url);
const packages = ['markdown-it', 'markdown-it-texmath', 'katex', 'playwright-core'];

export function inspectEnvironment({ browser } = {}) {
  const dependencies = Object.fromEntries(packages.map(name => {
    try { require.resolve(name); return [name, true]; }
    catch { return [name, false]; }
  }));
  let chromiumExecutable;
  if (dependencies['playwright-core']) chromiumExecutable = require('playwright-core').chromium.executablePath();
  const executable = findBrowser({ explicit: browser, chromiumExecutable });
  const editors = detectEditors();
  const chineseFonts = detectChineseFonts();
  const nodeSupported = Number(process.versions.node.split('.')[0]) >= 20;
  const recommendations = [];
  if (!editors.length) recommendations.push({ component: 'editor', action: 'Ask whether to install a Markdown editor; declining must not prevent PDF generation.' });
  if (!nodeSupported) recommendations.push({ component: 'node', action: 'Ask whether to update Node.js to version 20 or later, or use an existing PDF converter.' });
  if (Object.values(dependencies).some(value => !value)) recommendations.push({ component: 'dependencies', action: 'After approval, run npm ci in the skill directory, or use an existing local converter.' });
  if (!executable) recommendations.push({ component: 'browser', action: 'Use --browser for an existing Chromium browser, or ask before installing one.' });
  if (!chineseFonts.length) recommendations.push({ component: 'fonts', action: 'No known Chinese font detected. Verify glyphs when generating Chinese notes; ask before installing a font if necessary.' });
  return { platform: process.platform, editors, markdownExtensions: detectMarkdownExtensions(),
    renderer: { node: process.versions.node, nodeSupported, dependencies, browser: executable,
      chineseFonts, readyForSmokeTest: nodeSupported && Object.values(dependencies).every(Boolean) && Boolean(executable) },
    smokeTest: { status: 'not-run' }, recommendations,
    note: 'Detection does not install software or grant permissions. A successful smoke test does not verify the final learning material.' };
}

export async function smokeTest(report) {
  if (!report.renderer.readyForSmokeTest) {
    report.smokeTest = { status: 'failed', error: 'Required renderer components are missing. See recommendations.' };
    return report;
  }
  const temporaryRoot = path.resolve(os.tmpdir());
  const directory = await fs.mkdtemp(path.join(temporaryRoot, 'learn-distill-check-'));
  try {
    const { renderMarkdownFile } = await import('./render_pdf.mjs');
    const input = path.join(directory, 'check.md');
    await fs.writeFile(input, '# 转换自检\n\n中文、English 与公式 $a^2+b^2=c^2$。\n', 'utf8');
    const result = await renderMarkdownFile({ input, browser: report.renderer.browser });
    report.smokeTest = { status: 'passed', bytes: result.bytes, mathExpressions: result.mathExpressions };
  } catch (error) {
    report.smokeTest = { status: 'failed', error: error.message };
  } finally {
    // Only remove the fresh, known scratch directory created by this invocation.
    const relative = path.relative(temporaryRoot, path.resolve(directory));
    if (!relative.startsWith('learn-distill-check-') || relative.includes(path.sep)) {
      throw new Error('Unexpected scratch path; cleanup refused.');
    }
    await fs.rm(directory, { recursive: true, force: true });
  }
  return report;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    const args = process.argv.slice(2);
    let browser;
    let runSmokeTest = false;
    for (let index = 0; index < args.length; index++) {
      if (args[index] === '--smoke-test') runSmokeTest = true;
      else if (args[index] === '--browser' && args[index + 1]) browser = args[++index];
      else throw new Error(`Unknown or incomplete option: ${args[index]}`);
    }
    const report = inspectEnvironment({ browser });
    if (runSmokeTest) await smokeTest(report);
    console.log(JSON.stringify(report, null, 2));
    if (runSmokeTest && report.smokeTest.status !== 'passed') process.exitCode = 1;
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }));
    process.exitCode = 1;
  }
}
