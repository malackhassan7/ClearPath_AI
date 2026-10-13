import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import { run, waitForHealth } from './processes.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backendDir = resolve(root, 'backend');
const isWin = process.platform === 'win32';
const python = resolve(root, isWin ? '.venv-backend/Scripts/python.exe' : '.venv-backend/bin/python');
const vite = resolve(root, 'node_modules/vite/bin/vite.js');
const children = [];
let stopping = false;

async function stopAll() {
  if (stopping) return;
  stopping = true;
  await Promise.all(children.map(async child => {
    if (!child.pid || child.exitCode !== null) return;
    if (isWin) {
      await run('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }).catch(() => {});
    } else {
      try { process.kill(-child.pid, 'SIGTERM'); } catch {}
    }
  }));
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => { await stopAll(); process.exit(signal === 'SIGINT' ? 130 : 143); });
}

async function checkPort(port) {
  await new Promise((resolvePromise, reject) => {
    const server = net.createServer();
    server.once('error', () => reject(new Error(`Port ${port} is already in use. Stop that service or launch components separately.`)));
    server.listen(port, '127.0.0.1', () => server.close(resolvePromise));
  });
}

function start(command, args, cwd) {
  const child = spawn(command, args, { cwd, stdio: 'inherit', shell: false, detached: !isWin });
  children.push(child);
  child.once('error', () => { void stopAll(); process.exitCode = 1; });
  child.once('exit', () => { if (!stopping) { process.exitCode = 1; void stopAll(); } });
  return child;
}

try {
  if (!existsSync(vite)) throw new Error('Run npm ci first.');
  if (!existsSync(python)) throw new Error('Create .venv-backend and install backend/requirements-dev.txt. See README.md.');
  await checkPort(8000);
  await checkPort(3000);
  await run(python, ['scripts/backend_setup.py', '--check'], { cwd: backendDir });
  const api = start(python, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'], backendDir);
  await waitForHealth('http://127.0.0.1:8000/health', api);
  start(process.execPath, [vite, '--host', '127.0.0.1', '--port', '3000', '--strictPort'], root);
  console.log('CLEARPATH AI / SIH 26130: backend healthy. Frontend starting at http://127.0.0.1:3000');
} catch (error) {
  console.error(`CLEARPATH AI startup failed: ${error.message}`);
  await stopAll();
  process.exitCode = 1;
}
