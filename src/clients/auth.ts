import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { AuthToken } from '../types';

export const admin = {
  username: process.env.BOOKER_USERNAME ?? 'admin',
  password: process.env.BOOKER_PASSWORD ?? 'password123',
};

export const basicHeader = (): Record<string, string> => ({
  Authorization: `Basic ${Buffer.from(`${admin.username}:${admin.password}`).toString('base64')}`,
});

export class AuthClient {
  constructor(private readonly api: APIRequestContext) {}

  requestToken(data: unknown = admin): Promise<APIResponse> {
    return this.api.post('/auth', { data });
  }

  async token(): Promise<string> {
    const body = (await (await this.requestToken()).json()) as AuthToken;
    return body.token;
  }
}
