import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { findBrowser, skillRoot } from './runtime.mjs';

const require = createRequire(import.meta.url);
const imageTypes = new Map([['.png', 'image/png'], ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'], ['.gif', 'image/gif'], ['.svg', 'image/svg+xml']]);
let cachedStyles;

function dependency(name) {
  try { return require(name); }
  catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
    throw new Error(`Missing dependency: ${name}. After installation approval, run npm ci in the skill directory.`, { cause: error });
  }
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

export function isWithin(directory, candidate) {
  const relative = path.relative(directory, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function embedImage(source, sourceDirectory) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(source)) {
    throw new Error(`Use a local image instead of a URL: ${source}`);
  }
  let decoded;
  try { decoded = decodeURIComponent(source); }
  catch { throw new Error(`Invalid image path encoding: ${source}`); }
  const root = fs.realpathSync(sourceDirectory);
  let file;
  try { file = fs.realpathSync(path.resolve(root, decoded)); }
  catch { throw new Error(`Image not found: ${source}`); }
  if (!isWithin(root, file)) throw new Error(`Image is outside the Markdown directory: ${source}`);
  const mime = imageTypes.get(path.extname(file).toLowerCase());
  if (!mime) throw new Error(`Unsupported image format: ${source}`);
  const bytes = fs.readFileSync(file);
  if (!bytes.length) throw new Error(`Empty image: ${source}`);
  if (mime === 'image/svg+xml') {
    const svg = bytes.toString('utf8');
    const references = [...svg.matchAll(/(?:href|src)\s*=\s*(["'])(.*?)\1/gi)].map(match => match[2]);
    const styleUrls = [...svg.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi)].map(match => (match[1] ?? match[2] ?? match[3]).trim());
    if (!/<svg\b/i.test(svg) || /<script\b|<foreignObject\b|\bon[a-z]+\s*=|<!DOCTYPE|<!ENTITY|@import/i.test(svg)
      || references.some(reference => !/^(?:#|data:image\/(?:png|jpeg|webp|gif);base64,)/i.test(reference))
      || styleUrls.some(reference => !reference.startsWith('#'))) {
      throw new Error(`SVG must be a passive, self-contained image: ${source}`);
    }
  }
  return { data: `data:${mime};base64,${bytes.toString('base64')}`, file };
}

function embeddedStyles() {
  if (cachedStyles) return cachedStyles;
  const katexDirectory = path.dirname(require.resolve('katex'));
  const mathCss = fs.readFileSync(path.join(katexDirectory, 'katex.min.css'), 'utf8');
  const mathLicense = fs.readFileSync(path.join(katexDirectory, '..', 'LICENSE'), 'utf8').replaceAll('*/', '* /');
  const embedded = mathCss.replace(/url\(([^)]+)\)/g, (_match, rawUrl) => {
    const font = path.resolve(katexDirectory, rawUrl.replace(/^["']|["']$/g, ''));
    if (!isWithin(katexDirectory, font)) throw new Error('Unexpected KaTeX font path.');
    const extension = path.extname(font).slice(1);
    const mime = ({ woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf' })[extension];
    if (!mime) throw new Error(`Unsupported font format: ${extension}`);
    return `url(data:${mime};base64,${fs.readFileSync(font).toString('base64')})`;
  });
  cachedStyles = `/* KaTeX license for embedded CSS and fonts:\n${mathLicense}\n*/\n${embedded}\n${fs.readFileSync(path.join(skillRoot, 'assets', 'print.css'), 'utf8')}`;
  return cachedStyles;
}

function walkTokens(tokens, visit) {
  for (const token of tokens) {
    visit(token);
    if (token.children) walkTokens(token.children, visit);
  }
}

export function buildHtml({ markdown, sourceDirectory, title, lang = 'zh-CN' }) {
  if (!markdown?.trim()) throw new Error('Markdown is empty.');
  if (!/^[a-z]{2,8}(?:-[a-z\d]{1,8})*$/i.test(lang)) throw new Error(`Invalid language tag: ${lang}`);
  const MarkdownIt = dependency('markdown-it');
  const katex = dependency('katex');
  const texmath = dependency('markdown-it-texmath');
  const md = new MarkdownIt({ html: false, linkify: false, typographer: false })
    .use(texmath, { engine: katex, delimiters: ['dollars', 'brackets'] });
  const environment = {};
  let mathExpressions = 0;
  const assets = new Set();
  const defaultImageRenderer = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, index, options, env, renderer) => {
    const token = tokens[index];
    const image = defaultImageRenderer(tokens, index, options, env, renderer);
    const caption = renderer.renderInline(token.children || [], options, env);
    return `<span class="study-figure">${image}${caption ? `<span class="figure-caption">${caption}</span>` : ''}</span>`;
  };
  // Override texmath's error-swallowing renderer: a broken formula must fail conversion.
  for (const type of ['math_inline', 'math_inline_double', 'math_block', 'math_block_eqno']) {
    md.renderer.rules[type] = (tokens, index) => {
      const token = tokens[index];
      let math;
      try {
        math = katex.renderToString(token.content, { displayMode: type !== 'math_inline',
          throwOnError: true, trust: false, strict: 'warn', output: 'htmlAndMathml' });
      } catch (error) {
        throw new Error(`Invalid formula: ${token.content.slice(0, 100)}. ${error.message}`);
      }
      mathExpressions += 1;
      if (type === 'math_inline') return `<eq>${math}</eq>`;
      if (type === 'math_block_eqno') return `<section class="eqno"><eqn>${math}</eqn><span>(${escapeHtml(token.info)})</span></section>`;
      return `<section><eqn>${math}</eqn></section>`;
    };
  }
  const tokens = md.parse(markdown, environment);
  walkTokens(tokens, token => {
    if (token.type === 'fence' && /^(mermaid|plantuml|dot|graphviz|math)(?:\s|$)/i.test(token.info.trim())) {
      throw new Error(`Unrendered diagram/math block: ${token.info}. Export a local image or use LaTeX math delimiters.`);
    }
    if (token.type === 'image') {
      const image = embedImage(token.attrGet('src'), sourceDirectory);
      token.attrSet('src', image.data);
      assets.add(image.file);
    }
  });
  const body = md.renderer.render(tokens, md.options, environment);
  const documentTitle = title || markdown.match(/^#\s+(.+)$/m)?.[1] || 'Study notes';
  const html = `<!doctype html>
<html lang="${escapeHtml(lang)}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; form-action 'none'">
<title>${escapeHtml(documentTitle)}</title><style>${embeddedStyles()}</style>
</head><body><main>${body}</main></body></html>`;
  return { html, title: documentTitle, mathExpressions, assets: [...assets] };
}

async function atomicWrite(destination, contents) {
  await fsp.mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${randomUUID()}.tmp`;
  try {
    await fsp.writeFile(temporary, contents, { flag: 'wx' });
    await fsp.rename(temporary, destination);
  } finally {
    await fsp.rm(temporary, { force: true });
  }
}

export async function renderMarkdownFile({ input, output, htmlOutput, title, lang = 'zh-CN', browser: explicitBrowser } = {}) {
  if (!input) throw new Error('A Markdown input file is required.');
  const inputPath = path.resolve(input);
  if (!/\.(md|markdown)$/i.test(inputPath)) throw new Error('Input must be a .md or .markdown file.');
  const stem = inputPath.replace(/\.(md|markdown)$/i, '');
  const pdfPath = path.resolve(output || `${stem}.pdf`);
  const htmlPath = path.resolve(htmlOutput || `${stem}.html`);
  if (!/\.pdf$/i.test(pdfPath) || !/\.html$/i.test(htmlPath)) throw new Error('Output paths must end in .pdf and .html.');
  const paths = [inputPath, pdfPath, htmlPath].map(file => process.platform === 'win32' ? file.toLowerCase() : file);
  if (new Set(paths).size !== 3) throw new Error('Source, PDF and HTML paths must be distinct.');
  const source = await fsp.readFile(inputPath, 'utf8');
  const document = buildHtml({ markdown: source, sourceDirectory: path.dirname(inputPath), title, lang });
  const { chromium } = dependency('playwright-core');
  const executablePath = findBrowser({ explicit: explicitBrowser, chromiumExecutable: chromium.executablePath() });
  if (!executablePath) throw new Error('No Chromium/Edge/Chrome found. Specify --browser or ask before installing a browser.');
  let browser;
  let pdf;
  try {
    browser = await chromium.launch({ executablePath, headless: true, timeout: 30000 });
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1000, height: 900 } });
    await context.route('**/*', route => route.abort());
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    await page.setContent(document.html, { waitUntil: 'load', timeout: 30000 });
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(image => image.decode()));
    });
    const overflow = await page.evaluate(() => {
      const main = document.querySelector('main');
      const bounds = main.getBoundingClientRect();
      return [...main.querySelectorAll('table, pre, p, li, h1, h2, h3, eqn, img, .katex-html')]
        .filter(element => {
          const box = element.getBoundingClientRect();
          return box.width > 0 && (box.left < bounds.left - 2 || box.right > bounds.right + 2 || element.scrollWidth > Math.max(element.clientWidth, box.width) + 2);
        })
        .slice(0, 5).map(element => (element.textContent || element.getAttribute('alt') || element.tagName).trim().slice(0, 100));
    });
    if (overflow.length) throw new Error(`Content exceeds printable width. Split the formula/table or shorten the line: ${overflow.join(' | ')}`);
    pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true, tagged: true,
      displayHeaderFooter: true, headerTemplate: '<div></div>',
      footerTemplate: '<div style="font:9px Arial;color:#65717c;width:100%;text-align:center"><span class="pageNumber"></span> / <span class="totalPages"></span></div>' });
  } finally {
    if (browser) await browser.close();
  }
  if (!pdf || pdf.length < 1000 || pdf.subarray(0, 5).toString() !== '%PDF-' || !pdf.subarray(-2048).includes(Buffer.from('%%EOF'))) {
    throw new Error('Browser did not return a complete PDF.');
  }
  // Compute and validate both outputs before replacing any previous successful output.
  await atomicWrite(htmlPath, document.html);
  await atomicWrite(pdfPath, pdf);
  return { ok: true, input: inputPath, markdown: inputPath, pdf: pdfPath, html: htmlPath,
    bytes: pdf.length, mathExpressions: document.mathExpressions, images: document.assets.length,
    assets: document.assets, browser: executablePath,
    verification: 'Converted. PDF text checks and page-by-page visual review are still required.' };
}

export function parseArguments(args) {
  const result = {};
  const names = { '--output': 'output', '--html': 'htmlOutput', '--title': 'title', '--lang': 'lang', '--browser': 'browser' };
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--help' || argument === '-h') return { help: true };
    if (argument.startsWith('-')) {
      const name = names[argument];
      if (!name) throw new Error(`Unknown option: ${argument}`);
      const value = args[++index];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${argument}`);
      result[name] = value;
    } else if (!result.input) result.input = argument;
    else throw new Error(`Unexpected argument: ${argument}`);
  }
  if (!result.input) throw new Error('Usage: node render_pdf.mjs notes.md [--output notes.pdf] [--html notes.html] [--title title] [--lang zh-CN] [--browser executable]');
  return result;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) console.log('Usage: node render_pdf.mjs notes.md [--output notes.pdf] [--html notes.html] [--title title] [--lang zh-CN] [--browser executable]');
    else console.log(JSON.stringify(await renderMarkdownFile(options), null, 2));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }));
    process.exitCode = 1;
  }
}
