import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { run, waitForHealth } from './processes.mjs';

test('a failed prerequisite stops the startup sequence', async () => {
  await assert.rejects(run(process.execPath, ['-e', 'process.exit(7)'], { stdio: 'ignore' }), /exit 7/);
});

test('a dead backend never becomes ready', async () => {
  await assert.rejects(waitForHealth('http://127.0.0.1:1/health', { exitCode: 1, signalCode: null }), /exited/);
});

test('readiness requires a successful healthy response', async () => {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy' }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await waitForHealth(`http://127.0.0.1:${server.address().port}/health`, { exitCode: null, signalCode: null });
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('an unhealthy service times out instead of reporting startup success', async () => {
  const server = http.createServer((req, res) => { res.writeHead(503); res.end(); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await assert.rejects(waitForHealth(`http://127.0.0.1:${server.address().port}/health`, { exitCode: null, signalCode: null }, 100), /did not become healthy/);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
