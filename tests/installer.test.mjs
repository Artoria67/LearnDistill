import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { installSkill, resolveInstallDirectory, skillName } from '../scripts/install.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'skills', skillName);
const installer = path.join(root, 'scripts', 'install.mjs');

async function scratch(context) {
  const base = await fs.realpath(os.tmpdir());
  const directory = await fs.mkdtemp(path.join(base, 'installer-test-'));
  context.after(async () => {
    assert.equal(path.dirname(directory), base, 'Cleanup must stay inside the known test directory.');
    assert.ok(path.basename(directory).startsWith('installer-test-'));
    await fs.rm(directory, { recursive: true, force: true });
  });
  return directory;
}

test('all four agents receive a complete standalone skill at their project location', async context => {
  const project = path.join(await scratch(context), "learner's 中文 project");
  await fs.mkdir(project);
  for (const [agent, folder] of [['codex', '.agents'], ['claude-code', '.claude'], ['cursor', '.cursor'], ['copilot', '.github']]) {
    const result = JSON.parse(execFileSync(process.execPath, [installer, '--agent', agent], { cwd: project, encoding: 'utf8', windowsHide: true }));
    assert.equal(result.ok, true);
    assert.equal(result.directory, path.join(await fs.realpath(project), folder, 'skills', skillName));
    for (const file of ['SKILL.md', 'scripts/runtime.mjs', 'scripts/check_environment.mjs', 'scripts/render_pdf.mjs',
      'references/environment.md', 'references/source-reading.md', 'references/study-notes.md', 'references/delivery.md',
      'assets/print.css', 'package.json', 'package-lock.json']) {
      assert.deepEqual(await fs.readFile(path.join(result.directory, file)), await fs.readFile(path.join(source, file)));
    }
    await assert.rejects(fs.access(path.join(result.directory, 'node_modules')));
    await assert.rejects(fs.access(path.join(result.directory, '.codex-plugin')));
    assert.deepEqual(await fs.readdir(path.dirname(result.directory)), [skillName], 'No staging directory should remain.');
  }
});

test('user scope resolves to documented home locations without writing to the real home', async context => {
  const fakeHome = await scratch(context);
  for (const [agent, folder] of [['codex', '.agents'], ['claude-code', '.claude'], ['cursor', '.cursor'], ['copilot', '.copilot']]) {
    const result = await installSkill({ agent, scope: 'user', homeDirectory: fakeHome });
    assert.equal(result.directory, path.join(await fs.realpath(fakeHome), folder, 'skills', skillName));
    assert.equal(resolveInstallDirectory({ agent, scope: 'user', homeDirectory: fakeHome }), path.join(fakeHome, folder, 'skills', skillName));
    await fs.access(path.join(result.directory, 'SKILL.md'));
  }
});

test('custom installation runs environment inspection outside the source repository without dependencies', async context => {
  const project = await scratch(context);
  const result = JSON.parse(execFileSync(process.execPath, [installer, '--dest', path.join(project, 'other-agent', 'skills')],
    { cwd: project, encoding: 'utf8', windowsHide: true }));
  const report = JSON.parse(execFileSync(process.execPath, [path.join(result.directory, 'scripts', 'check_environment.mjs')],
    { cwd: project, encoding: 'utf8', windowsHide: true, env: { ...process.env, NODE_PATH: '' } }));
  assert.equal(report.renderer.dependencies['markdown-it'], false);
  assert.equal(report.renderer.readyForSmokeTest, false);
  assert.equal(typeof report.renderer.nodeSupported, 'boolean');
  assert.equal(report.smokeTest.status, 'not-run');
});

test('existing skill directories and their local changes are preserved', async context => {
  const destination = await scratch(context);
  const result = await installSkill({ destination });
  const entrypoint = path.join(result.directory, 'SKILL.md');
  await fs.writeFile(entrypoint, '# User changes\n');
  await assert.rejects(installSkill({ destination }), /already exists/);
  assert.equal(await fs.readFile(entrypoint, 'utf8'), '# User changes\n');
  assert.deepEqual(await fs.readdir(destination), [skillName]);
});

test('invalid commands and self-copy attempts fail before creating an installation', async context => {
  const project = await scratch(context);
  for (const args of [[], ['--agent', 'unknown'], ['--agent', 'codex', '--scope', 'invalid'],
    ['--agent'], ['--dest', project, '--agent', 'codex'], ['--agent', 'codex', '--agent', 'cursor'],
    ['--agent', 'codex', '--scope', 'user', '--project-dir', project], ['--unknown']]) {
    const result = spawnSync(process.execPath, [installer, ...args], { cwd: project, encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 1, JSON.stringify(args));
    assert.equal(JSON.parse(result.stderr).ok, false);
  }
  await assert.rejects(installSkill({ destination: path.join(source, 'nested') }), /overlap/);
  assert.deepEqual(await fs.readdir(project), []);
  await assert.rejects(fs.access(path.join(source, 'nested')));
});
