import type { APIResponse } from '@playwright/test';
import { newBooking } from '../src/data';
import { expect, test } from '../src/fixtures';

async function elapsed(call: () => Promise<APIResponse>): Promise<number> {
  const start = performance.now();
  await call();
  return performance.now() - start;
}

test(
  'the health check stays inside the budget',
  { tag: '@smoke' },
  async ({ health, responseBudgetMs }) => {
    expect(await elapsed(() => health.ping())).toBeLessThan(responseBudgetMs);
  },
);

test(
  'reading a booking stays inside the budget',
  { tag: '@regression' },
  async ({ bookings, booking, responseBudgetMs }) => {
    expect(await elapsed(() => bookings.getRaw(booking.id))).toBeLessThan(responseBudgetMs);
  },
);

test(
  'creating a booking stays inside the budget',
  { tag: '@regression' },
  async ({ bookings, responseBudgetMs }) => {
    const data = newBooking();
    let id = 0;

    const duration = await elapsed(async () => {
      const response = await bookings.createRaw(data);
      id = ((await response.json()) as { bookingid: number }).bookingid;
      return response;
    });

    expect(duration).toBeLessThan(responseBudgetMs);

    await bookings.removeRaw(id);
  },
);
