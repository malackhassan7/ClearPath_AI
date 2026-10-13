import { spawn } from 'node:child_process';

export function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: false, ...options });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Process failed (exit ${code}): ${command}`)));
  });
}

export async function waitForHealth(url, child, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) throw new Error('Backend exited before becoming ready.');
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
      if (response.ok && (await response.json()).status === 'healthy') return;
    } catch { /* bounded retry while the child starts */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Backend did not become healthy. Check PostgreSQL and backend/.env.');
}
