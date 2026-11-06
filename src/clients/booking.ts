import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { Booking, BookingId, CreatedBooking } from '../types';

export interface BookingFilter {
  firstname?: string;
  lastname?: string;
  checkin?: string;
  checkout?: string;
}

export class BookingClient {
  constructor(
    private readonly api: APIRequestContext,
    private readonly token: string,
  ) {}

  cookie(token = this.token): Record<string, string> {
    return { Cookie: `token=${token}` };
  }

  listRaw(filter: BookingFilter = {}): Promise<APIResponse> {
    return this.api.get('/booking', { params: { ...filter } });
  }

  async list(filter: BookingFilter = {}): Promise<BookingId[]> {
    return this.parse<BookingId[]>(await this.listRaw(filter));
  }

  getRaw(id: number): Promise<APIResponse> {
    return this.api.get(`/booking/${String(id)}`);
  }

  async get(id: number): Promise<Booking> {
    return this.parse<Booking>(await this.getRaw(id));
  }

  createRaw(data: unknown): Promise<APIResponse> {
    return this.api.post('/booking', { data });
  }

  async create(data: Booking): Promise<CreatedBooking> {
    return this.parse<CreatedBooking>(await this.createRaw(data));
  }

  replaceRaw(id: number, data: unknown, headers = this.cookie()): Promise<APIResponse> {
    return this.api.put(`/booking/${String(id)}`, { data, headers });
  }

  async replace(id: number, data: Booking): Promise<Booking> {
    return this.parse<Booking>(await this.replaceRaw(id, data));
  }

  updateRaw(id: number, data: unknown, headers = this.cookie()): Promise<APIResponse> {
    return this.api.patch(`/booking/${String(id)}`, { data, headers });
  }

  async update(id: number, data: Partial<Booking>): Promise<Booking> {
    return this.parse<Booking>(await this.updateRaw(id, data));
  }

  removeRaw(id: number, headers = this.cookie()): Promise<APIResponse> {
    return this.api.delete(`/booking/${String(id)}`, { headers });
  }

  private async parse<T>(response: APIResponse): Promise<T> {
    if (!response.ok()) {
      throw new Error(
        `${response.url()} responded ${String(response.status())}: ${await response.text()}`,
      );
    }
    return (await response.json()) as T;
  }
}
