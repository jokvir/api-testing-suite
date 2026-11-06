import { expect, test } from '../src/fixtures';

test('the API answers a health check', { tag: '@smoke' }, async ({ health }) => {
  const response = await health.ping();

  expect(response.status()).toBe(201);
  expect(await response.text()).toBe('Created');
});
