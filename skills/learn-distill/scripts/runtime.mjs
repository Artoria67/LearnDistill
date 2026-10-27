import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function isFile(candidate) {
  try { return Boolean(candidate) && fs.statSync(candidate).isFile(); }
  catch { return false; }
}

export function findExecutable(name, { env = process.env, platform = process.platform } = {}) {
  const separator = platform === 'win32' ? ';' : ':';
  const extensions = platform === 'win32'
    ? ['', ...(env.PATHEXT || '.EXE;.CMD;.BAT').split(';')]
    : [''];
  for (const directory of (env.PATH || env.Path || '').split(separator).filter(Boolean)) {
    for (const extension of extensions) {
      const candidate = path.join(directory.replace(/^"|"$/g, ''), name + extension.toLowerCase());
      if (isFile(candidate)) return candidate;
    }
  }
  return null;
}

export function findBrowser({ explicit, chromiumExecutable, env = process.env, platform = process.platform } = {}) {
  if (explicit) {
    const candidate = path.resolve(explicit);
    if (!isFile(candidate)) throw new Error(`Browser executable not found: ${candidate}`);
    return candidate;
  }
  if (isFile(chromiumExecutable)) return chromiumExecutable;
  const candidates = [];
  if (platform === 'win32') {
    for (const root of [env['ProgramFiles(x86)'], env.ProgramFiles, env.LOCALAPPDATA,
      'C:\\Program Files (x86)', 'C:\\Program Files'].filter(Boolean)) {
      candidates.push(path.join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
      candidates.push(path.join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'));
      candidates.push(path.join(root, 'Chromium', 'Application', 'chrome.exe'));
    }
  } else if (platform === 'darwin') {
    for (const root of ['/Applications', path.join(env.HOME || os.homedir(), 'Applications')]) {
      for (const [app, executable] of [['Google Chrome', 'Google Chrome'], ['Microsoft Edge', 'Microsoft Edge'], ['Chromium', 'Chromium']]) {
        candidates.push(path.join(root, `${app}.app`, 'Contents', 'MacOS', executable));
      }
    }
  }
  for (const name of ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable', 'microsoft-edge', 'msedge', 'chrome']) {
    candidates.push(findExecutable(name, { env, platform }));
  }
  return candidates.find(isFile) || null;
}

export function detectEditors({ env = process.env, platform = process.platform } = {}) {
  const definitions = [
    ['VS Code', ['code', 'code-insiders'], ['Microsoft VS Code', 'Code.exe']],
    ['VSCodium', ['codium'], ['VSCodium', 'VSCodium.exe']],
    ['Typora', ['typora'], ['Typora', 'Typora.exe']],
    ['Obsidian', ['obsidian'], ['Obsidian', 'Obsidian.exe']],
    ['MarkText', ['marktext'], ['MarkText', 'MarkText.exe']],
    ['Zettlr', ['zettlr'], ['Zettlr', 'Zettlr.exe']],
  ];
  return definitions.flatMap(([name, commands, windowsParts]) => {
    const candidates = commands.map(command => findExecutable(command, { env, platform }));
    if (platform === 'win32') {
      for (const root of [env.ProgramFiles, env['ProgramFiles(x86)'], env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Programs'), env.LOCALAPPDATA].filter(Boolean)) {
        candidates.push(path.join(root, ...windowsParts));
      }
    } else if (platform === 'darwin') {
      const app = name === 'VS Code' ? 'Visual Studio Code' : name;
      for (const root of ['/Applications', path.join(env.HOME || os.homedir(), 'Applications')]) {
        candidates.push(path.join(root, `${app}.app`, 'Contents', 'MacOS', name === 'VS Code' ? 'Electron' : name));
      }
    }
    const executable = candidates.find(isFile);
    return executable ? [{ name, executable, markdownPreview: 'built-in' }] : [];
  });
}

export function detectMarkdownExtensions(userDirectory = os.homedir()) {
  const known = ['yzhang.markdown-all-in-one', 'yzane.markdown-pdf', 'shd101wyy.markdown-preview-enhanced', 'bierner.markdown-mermaid'];
  const found = new Set();
  for (const folder of ['.vscode', '.vscode-insiders', '.vscode-oss']) {
    try {
      for (const entry of fs.readdirSync(path.join(userDirectory, folder, 'extensions'))) {
        for (const id of known) if (entry.startsWith(`${id}-`)) found.add(id);
      }
    } catch { /* An editor or extensions folder may not exist. */ }
  }
  return [...found];
}

export function detectChineseFonts({ env = process.env, platform = process.platform } = {}) {
  if (platform === 'win32') {
    const fonts = path.join(env.WINDIR || 'C:\\Windows', 'Fonts');
    return ['msyh.ttc', 'msyh.ttf', 'simsun.ttc', 'simhei.ttf'].filter(name => isFile(path.join(fonts, name)));
  }
  if (platform === 'darwin') {
    return ['/System/Library/Fonts/PingFang.ttc', '/System/Library/Fonts/STHeiti Light.ttc'].filter(isFile).map(file => path.basename(file));
  }
  const command = findExecutable('fc-list', { env, platform });
  if (!command) return [];
  const result = spawnSync(command, [':lang=zh', 'family'], { encoding: 'utf8', timeout: 5000, windowsHide: true });
  if (result.status !== 0) return [];
  return [...new Set(result.stdout.trim().split(/\r?\n/).filter(Boolean))].slice(0, 8);
}
