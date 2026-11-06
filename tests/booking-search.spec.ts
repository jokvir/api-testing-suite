import { newBooking } from '../src/data';
import { expect, test } from '../src/fixtures';
import { documentationBug } from '../src/known-defect';

test(
  'a new booking appears in the list of ids',
  { tag: '@smoke' },
  async ({ bookings, booking }) => {
    const ids = await bookings.list();

    expect(ids).toMatchSchema('booking-ids');
    expect(ids).toContainEqual({ bookingid: booking.id });
  },
);

test('filters by first and last name', { tag: '@regression' }, async ({ bookings, booking }) => {
  const { firstname, lastname } = booking.data;

  const ids = await bookings.list({ firstname, lastname });

  expect(ids).toEqual([{ bookingid: booking.id }]);
});

test('returns an empty list when nobody matches', { tag: '@regression' }, async ({ bookings }) => {
  const ids = await bookings.list({ firstname: 'Nobody', lastname: 'Matches' });

  expect(ids).toEqual([]);
});

test('filters by checkin date', { tag: '@regression' }, async ({ bookings }) => {
  const stay = { checkin: '2030-06-02', checkout: '2030-06-10' };
  const created = await bookings.create(newBooking({ bookingdates: stay }));

  const ids = await bookings.list({ checkin: '2030-06-01' });

  expect(ids).toContainEqual({ bookingid: created.bookingid });

  await bookings.removeRaw(created.bookingid);
});

test.fail(
  'the checkin filter includes stays starting on the given date',
  documentationBug(
    'GetBookingIds documents checkin as "greater than or equal to", but the route builds a $gt query, so an exact match is left out.',
  ),
  async ({ bookings }) => {
    const checkin = '2030-07-01';
    const created = await bookings.create(
      newBooking({ bookingdates: { checkin, checkout: '2030-07-05' } }),
    );

    const ids = await bookings.list({ checkin });

    expect(ids).toContainEqual({ bookingid: created.bookingid });
  },
);
