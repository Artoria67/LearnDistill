import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { parse } from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillDirectory = path.join(root, 'skills', 'learn-distill');
const require = createRequire(path.join(skillDirectory, 'package.json'));
const markdown = require('markdown-it')({ html: false });
const read = file => fs.readFileSync(file, 'utf8');
const json = file => JSON.parse(read(file));
const plugin = json(path.join(root, '.codex-plugin', 'plugin.json'));
const entrypoint = read(path.join(skillDirectory, 'SKILL.md'));
const match = entrypoint.match(/^---\r?\n([\s\S]+?)\r?\n---(?:\r?\n|$)/);
assert.ok(match, 'Skill needs YAML frontmatter.');
const metadata = parse(match[1]);
assert.equal(metadata.name, path.basename(skillDirectory));
assert.match(metadata.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
assert.ok(metadata.name.length < 64);
assert.ok(typeof metadata.description === 'string' && metadata.description.length > 0 && metadata.description.length <= 1024);
assert.ok(!entrypoint.includes('[TODO:'), 'Remove unfinished scaffold instructions.');

assert.match(plugin.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
assert.equal(plugin.skills, './skills/');
assert.equal(plugin.requires_local_executor, true);
assert.ok(fs.statSync(path.resolve(root, plugin.skills)).isDirectory());
assert.ok(!plugin.mcpServers, 'This plugin must remain usable without an MCP service.');
const marketplace = json(path.join(root, '.agents', 'plugins', 'marketplace.json'));
const registration = marketplace.plugins.find(item => item.name === plugin.name);
assert.ok(registration, 'Repo marketplace must contain this plugin.');
assert.equal(registration.source.source, 'local');
assert.equal(path.resolve(root, registration.source.path), root);
assert.equal(registration.policy.installation, 'AVAILABLE');

const ui = parse(read(path.join(skillDirectory, 'agents', 'openai.yaml')));
assert.equal(ui.policy.allow_implicit_invocation, true);
assert.ok(ui.interface.default_prompt.includes(`$${metadata.name}`));
assert.ok([...ui.interface.short_description].length >= 25 && [...ui.interface.short_description].length <= 64);

const references = fs.readdirSync(path.join(skillDirectory, 'references')).filter(file => file.endsWith('.md'));
const publicDocuments = ['README.md', 'README.zh-CN.md', 'CONTRIBUTING.md', 'CONTRIBUTING.zh-CN.md',
  'docs/github-setup.md', 'docs/github-setup.zh-CN.md'].map(file => path.join(root, file));
function destinations(tokens) {
  return tokens.flatMap(token => [
    ...(token.type === 'link_open' ? [token.attrGet('href')] : []),
    ...(token.type === 'image' ? [token.attrGet('src')] : []),
    ...(token.children ? destinations(token.children) : []),
  ]);
}
for (const file of [...publicDocuments, path.join(skillDirectory, 'SKILL.md'), ...references.map(file => path.join(skillDirectory, 'references', file))]) {
  const body = read(file).replace(/^---\r?\n[\s\S]+?\r?\n---(?:\r?\n|$)/, '');
  for (const target of destinations(markdown.parse(body, {}))) {
    if (/^(?:https?:|#)/.test(target)) continue;
    const destination = path.resolve(path.dirname(file), target.split('#')[0]);
    assert.ok(fs.existsSync(destination), `Missing reference from ${path.basename(file)}: ${target}`);
  }
}

for (const directory of [root, skillDirectory]) {
  const manifest = json(path.join(directory, 'package.json'));
  const lock = json(path.join(directory, 'package-lock.json'));
  assert.equal(manifest.version, plugin.version, 'Package and plugin versions must agree.');
  assert.deepEqual(lock.packages[''].dependencies || {}, manifest.dependencies || {});
  assert.deepEqual(lock.packages[''].devDependencies || {}, manifest.devDependencies || {});
  for (const dependency of Object.values(lock.packages)) {
    if (!dependency.resolved) continue;
    const url = new URL(dependency.resolved);
    assert.equal(url.protocol, 'https:', 'Dependency archives must use HTTPS.');
    assert.ok(!url.username && !url.password, 'Do not commit registry credentials.');
  }
}

const scripts = [
  ...fs.readdirSync(path.join(root, 'scripts')).filter(file => file.endsWith('.mjs')).map(file => path.join(root, 'scripts', file)),
  ...fs.readdirSync(path.join(skillDirectory, 'scripts')).filter(file => file.endsWith('.mjs')).map(file => path.join(skillDirectory, 'scripts', file)),
];
for (const script of scripts) {
  const result = spawnSync(process.execPath, ['--check', script], { encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr || result.error?.message || `Syntax error: ${script}`);
}
console.log(`Validated plugin manifest, local marketplace, skill metadata, ${publicDocuments.length} public documents, ${references.length} references, dependency locks and ${scripts.length} scripts.`);
