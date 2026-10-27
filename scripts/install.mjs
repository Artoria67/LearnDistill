import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const skillName = 'learn-distill';
const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'skills', skillName);
const locations = {
  codex: { project: '.agents/skills', user: '.agents/skills' },
  'claude-code': { project: '.claude/skills', user: '.claude/skills' },
  cursor: { project: '.cursor/skills', user: '.cursor/skills' },
  copilot: { project: '.github/skills', user: '.copilot/skills' },
};

export function resolveInstallDirectory({ agent, scope = 'project', projectDirectory = process.cwd(),
  destination, homeDirectory = os.homedir() } = {}) {
  if (destination) return path.resolve(destination, skillName);
  if (!Object.hasOwn(locations, agent)) throw new Error('Choose --agent codex, claude-code, cursor or copilot, or use --dest <skills-directory>.');
  if (!['project', 'user'].includes(scope)) throw new Error('--scope must be project or user.');
  return path.resolve(scope === 'user' ? homeDirectory : projectDirectory, locations[agent][scope], skillName);
}

function contains(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

async function refuseExisting(directory) {
  try { await fs.lstat(directory); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  throw new Error(`Skill directory already exists; no files were overwritten: ${directory}`);
}

export async function installSkill(options) {
  const requested = resolveInstallDirectory(options);
  const actualSource = await fs.realpath(source);
  if (contains(actualSource, requested) || contains(requested, actualSource)) {
    throw new Error('Installation must not overlap the source skill directory.');
  }
  await fs.mkdir(path.dirname(requested), { recursive: true });
  const parent = await fs.realpath(path.dirname(requested));
  const directory = path.join(parent, skillName);
  if (contains(actualSource, directory) || contains(directory, actualSource)) {
    throw new Error('Installation must not overlap the source skill directory.');
  }
  await refuseExisting(directory);
  const staging = await fs.mkdtemp(path.join(parent, `.${skillName}-install-`));
  const payload = path.join(staging, skillName);
  try {
    await fs.cp(actualSource, payload, {
      recursive: true,
      force: false,
      errorOnExist: true,
      filter: file => !path.relative(actualSource, file).split(path.sep).some(part => ['node_modules', '.git'].includes(part)),
    });
    await refuseExisting(directory);
    await fs.rename(payload, directory);
    return { ok: true, directory, nextSteps: [
      'Refresh skills or start a new session in your agent.',
      'In the installed skill directory, run: node scripts/check_environment.mjs',
      'If dependencies are needed, run: npm ci --omit=dev --ignore-scripts',
      'Verify rendering with: node scripts/check_environment.mjs --smoke-test',
    ] };
  } finally {
    if (path.dirname(staging) !== parent || !path.basename(staging).startsWith(`.${skillName}-install-`)) {
      throw new Error('Unexpected staging path; cleanup refused.');
    }
    await fs.rm(staging, { recursive: true, force: true });
  }
}

function parseArguments(args) {
  const options = {};
  const flags = { '--agent': 'agent', '--scope': 'scope', '--project-dir': 'projectDirectory', '--dest': 'destination' };
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (flag === '--help' && args.length === 1) return { help: true };
    if (!Object.hasOwn(flags, flag)) throw new Error(`Unknown option: ${flag}`);
    const value = args[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    if (Object.hasOwn(options, flags[flag])) throw new Error(`Duplicate option: ${flag}`);
    options[flags[flag]] = value;
  }
  if (options.destination && (options.agent || options.scope || options.projectDirectory)) {
    throw new Error('--dest cannot be combined with --agent, --scope or --project-dir.');
  }
  if (options.scope === 'user' && options.projectDirectory) throw new Error('--project-dir applies only to project scope.');
  return options;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log('Install the complete skill without downloading dependencies or overwriting existing files.\n\n' +
        'node scripts/install.mjs --agent <codex|claude-code|cursor|copilot> [--scope <project|user>] [--project-dir <path>]\n' +
        'node scripts/install.mjs --dest <skills-directory>\n\n' +
        'Default scope: project (current directory). --dest is the skills parent directory.');
    } else console.log(JSON.stringify(await installSkill(options), null, 2));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }));
    process.exitCode = 1;
  }
}
