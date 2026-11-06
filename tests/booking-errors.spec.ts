import { newBooking } from '../src/data';
import { expect, test } from '../src/fixtures';
import { knownDefect } from '../src/known-defect';

const noAuth = {};

test('reading an unknown booking returns 404', { tag: '@smoke' }, async ({ bookings }) => {
  const response = await bookings.getRaw(99999999);

  expect(response.status()).toBe(404);
  expect(await response.text()).toBe('Not Found');
});

test('a write without a token is forbidden', { tag: '@smoke' }, async ({ bookings, booking }) => {
  const response = await bookings.replaceRaw(booking.id, newBooking(), noAuth);

  expect(response.status()).toBe(403);
});

test(
  'a write with an invalid token is forbidden',
  { tag: '@regression' },
  async ({ bookings, booking }) => {
    const response = await bookings.replaceRaw(
      booking.id,
      newBooking(),
      bookings.cookie('not-a-real-token'),
    );

    expect(response.status()).toBe(403);
  },
);

test(
  'deleting without a token is forbidden',
  { tag: '@regression' },
  async ({ bookings, booking }) => {
    const response = await bookings.removeRaw(booking.id, noAuth);

    expect(response.status()).toBe(403);
    expect((await bookings.getRaw(booking.id)).status()).toBe(200);
  },
);

test(
  'deleting the same booking twice is rejected',
  knownDefect(
    'Answers 405 Method Not Allowed on the second delete; 404 Not Found is the expected status.',
  ),
  async ({ bookings, booking }) => {
    await bookings.removeRaw(booking.id);

    const response = await bookings.removeRaw(booking.id);

    expect(response.status()).toBe(405);
  },
);

test(
  'an incomplete booking payload is rejected',
  knownDefect(
    'Answers 500 Internal Server Error on a payload missing required fields; 400 Bad Request is the expected status.',
  ),
  async ({ bookings }) => {
    const response = await bookings.createRaw({ firstname: 'Ada' });

    expect(response.status()).toBe(500);
  },
);

test(
  'a malformed checkin filter is rejected',
  knownDefect(
    'Answers 500 Internal Server Error on an unparsable date; 400 Bad Request is the expected status.',
  ),
  async ({ bookings }) => {
    const response = await bookings.listRaw({ checkin: 'not-a-date' });

    expect(response.status()).toBe(500);
  },
);
