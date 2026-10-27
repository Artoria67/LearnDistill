import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMarkdownFile } from '../skills/learn-distill/scripts/render_pdf.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, 'outputs', 'demo');
await fs.mkdir(destination, { recursive: true });
await fs.cp(path.join(root, 'examples'), destination, { recursive: true });
console.log(JSON.stringify(await renderMarkdownFile({ input: path.join(destination, 'calculus-section-1.md'), lang: 'zh-CN' }), null, 2));
