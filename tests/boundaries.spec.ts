import { newBooking } from '../src/data';
import { expect, test } from '../src/fixtures';
import { knownDefect } from '../src/known-defect';
import type { CreatedBooking } from '../src/types';

const cases = [
  { title: 'a free stay', overrides: { totalprice: 0 } },
  { title: 'a very expensive stay', overrides: { totalprice: 999999 } },
  {
    title: 'a same-day stay',
    overrides: { bookingdates: { checkin: '2026-03-01', checkout: '2026-03-01' } },
  },
  { title: 'a 255-character first name', overrides: { firstname: 'A'.repeat(255) } },
  { title: 'an unpaid deposit', overrides: { depositpaid: false } },
];

for (const { title, overrides } of cases) {
  test(`stores ${title}`, { tag: '@regression' }, async ({ bookings }) => {
    const data = newBooking(overrides);

    const created = await bookings.create(data);

    expect(created.booking).toEqual(data);
    expect(await bookings.get(created.bookingid)).toEqual(data);

    await bookings.removeRaw(created.bookingid);
  });
}

test(
  'omitting additionalneeds leaves it out of the response',
  { tag: '@regression' },
  async ({ bookings }) => {
    const { additionalneeds, ...data } = newBooking();

    const created = await bookings.create(data);

    expect(created.booking).toEqual(data);
    expect(created.booking).not.toHaveProperty('additionalneeds');

    await bookings.removeRaw(created.bookingid);
  },
);

test(
  'a fractional price is stored without its decimals',
  knownDefect(
    'The parser runs parseInt on totalprice, so 120.75 is silently stored as 120 instead of being rejected.',
  ),
  async ({ bookings }) => {
    const response = await bookings.createRaw(newBooking({ totalprice: 120.75 }));
    const created = (await response.json()) as CreatedBooking;

    expect(created.booking.totalprice).toBe(120);

    await bookings.removeRaw(created.bookingid);
  },
);
