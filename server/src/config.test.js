import test from 'node:test';
import assert from 'node:assert/strict';

import { validateEnv } from './config.js';
import { createApp } from './app.js';

const baseEnv = {
  PORT: '3001',
  CORS_ORIGIN: 'http://localhost:5173',
  NODE_ENV: 'test',
};

test('validateEnv accepts a valid environment', () => {
  const env = validateEnv(baseEnv);

  assert.equal(env.port, 3001);
  assert.equal(env.corsOrigin, 'http://localhost:5173');
  assert.equal(env.nodeEnv, 'test');
});

test('validateEnv rejects invalid port values', () => {
  assert.throws(
    () => validateEnv({ ...baseEnv, PORT: '0' }),
    /PORT value/
  );
});

test('validateEnv rejects invalid NODE_ENV and empty CORS origin', () => {
  assert.throws(
    () => validateEnv({ ...baseEnv, NODE_ENV: 'staging' }),
    /NODE_ENV/
  );

  assert.throws(
    () => validateEnv({ ...baseEnv, CORS_ORIGIN: '' }),
    /CORS_ORIGIN/
  );
});

test('security middleware injects headers and request ids', async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.ok(response.headers.get('x-request-id'));
    assert.equal(payload.status, 'ok');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});
