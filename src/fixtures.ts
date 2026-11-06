import { test as base } from '@playwright/test';
import { AuthClient } from './clients/auth';
import { BookingClient } from './clients/booking';
import { HealthClient } from './clients/health';
import { newBooking } from './data';
import type { Booking } from './types';

export interface Options {
  responseBudgetMs: number;
}

interface Fixtures {
  health: HealthClient;
  auth: AuthClient;
  token: string;
  bookings: BookingClient;
  booking: { id: number; data: Booking };
}

export const test = base.extend<Options & Fixtures>({
  responseBudgetMs: [500, { option: true }],

  health: async ({ request }, use) => {
    await use(new HealthClient(request));
  },

  auth: async ({ request }, use) => {
    await use(new AuthClient(request));
  },

  token: async ({ auth }, use) => {
    await use(await auth.token());
  },

  bookings: async ({ request, token }, use) => {
    await use(new BookingClient(request, token));
  },

  booking: async ({ bookings }, use) => {
    const data = newBooking();
    const created = await bookings.create(data);

    await use({ id: created.bookingid, data });

    // Tests about deletion remove the booking themselves, so a 405 here is expected.
    await bookings.removeRaw(created.bookingid);
  },
});

export { expect } from './schema';
