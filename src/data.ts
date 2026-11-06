import type { Booking } from './types';

let counter = 0;

export function newBooking(overrides: Partial<Booking> = {}): Booking {
  counter += 1;
  const unique = `${String(process.pid)}x${String(counter)}`;

  return {
    firstname: `Ada${unique}`,
    lastname: `Lovelace${unique}`,
    totalprice: 120,
    depositpaid: true,
    bookingdates: { checkin: '2026-01-01', checkout: '2026-01-05' },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}
