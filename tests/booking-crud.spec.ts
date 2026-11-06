import { newBooking } from '../src/data';
import { expect, test } from '../src/fixtures';
import { documentationBug, knownDefect } from '../src/known-defect';
import type { Booking, CreatedBooking } from '../src/types';

test('creates a booking and echoes it back', { tag: '@smoke' }, async ({ bookings }) => {
  const data = newBooking();

  const response = await bookings.createRaw(data);
  const created = (await response.json()) as CreatedBooking;

  expect(response.status()).toBe(200);
  expect(created).toMatchSchema('created-booking');
  expect(created.booking).toEqual(data);

  await bookings.removeRaw(created.bookingid);
});

test('reads a booking by id', { tag: '@smoke' }, async ({ bookings, booking }) => {
  const response = await bookings.getRaw(booking.id);
  const body = (await response.json()) as Booking;

  expect(response.status()).toBe(200);
  expect(body).toMatchSchema('booking');
  expect(body).toEqual(booking.data);
});

test('updates every field with PUT', { tag: '@smoke' }, async ({ bookings, booking }) => {
  const replacement = newBooking({ totalprice: 450, depositpaid: false });

  const updated = await bookings.replace(booking.id, replacement);

  expect(updated).toEqual(replacement);
  expect(await bookings.get(booking.id)).toEqual(replacement);
});

test(
  'changes only the given fields with PATCH',
  { tag: '@regression' },
  async ({ bookings, booking }) => {
    const updated = await bookings.update(booking.id, { firstname: 'Grace' });

    expect(updated).toEqual({ ...booking.data, firstname: 'Grace' });
  },
);

test(
  'applying the same PUT twice leaves the same booking',
  { tag: '@regression' },
  async ({ bookings, booking }) => {
    const replacement = newBooking({ totalprice: 300 });

    const first = await bookings.replace(booking.id, replacement);
    const second = await bookings.replace(booking.id, replacement);

    expect(second).toEqual(first);
  },
);

test(
  'deletes a booking',
  knownDefect('Answers 201 Created on a delete; 200 OK or 204 No Content is the expected status.'),
  async ({ bookings, booking }) => {
    const response = await bookings.removeRaw(booking.id);

    expect(response.status()).toBe(201);
    expect((await bookings.getRaw(booking.id)).status()).toBe(404);
  },
);

test.fail(
  'PUT replaces the booking rather than merging into it',
  documentationBug(
    'UpdateBooking is documented as a full update, but the model merges with Object.assign, so additionalneeds survives a PUT that omits it.',
  ),
  async ({ bookings, booking }) => {
    const { additionalneeds, ...withoutExtras } = newBooking();

    const updated = await bookings.replace(booking.id, withoutExtras);

    expect(updated.additionalneeds).toBeUndefined();
  },
);
