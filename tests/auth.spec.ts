import { admin, basicHeader } from '../src/clients/auth';
import { newBooking } from '../src/data';
import { expect, test } from '../src/fixtures';
import { knownDefect } from '../src/known-defect';
import type { AuthToken } from '../src/types';

test('valid credentials return a token', { tag: '@smoke' }, async ({ auth }) => {
  const response = await auth.requestToken();

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');
  expect((await response.json()) as AuthToken).toMatchSchema('auth-token');
});

test('the token authorises a write', { tag: '@smoke' }, async ({ bookings, booking }) => {
  const response = await bookings.replaceRaw(booking.id, newBooking());

  expect(response.status()).toBe(200);
});

test(
  'basic auth is accepted instead of a token',
  { tag: '@regression' },
  async ({ bookings, booking }) => {
    const response = await bookings.replaceRaw(booking.id, newBooking(), basicHeader());

    expect(response.status()).toBe(200);
  },
);

test(
  'a wrong password does not return a token',
  knownDefect('Answers 200 with a reason body; 401 Unauthorized is the expected status.'),
  async ({ auth }) => {
    const response = await auth.requestToken({ ...admin, password: 'wrong' });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ reason: 'Bad credentials' });
  },
);

test(
  'missing credentials do not return a token',
  knownDefect('Answers 200 with a reason body; 400 Bad Request is the expected status.'),
  async ({ auth }) => {
    const response = await auth.requestToken({});

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ reason: 'Bad credentials' });
  },
);
