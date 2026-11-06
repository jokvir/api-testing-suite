import type { APIRequestContext, APIResponse } from '@playwright/test';

export class HealthClient {
  constructor(private readonly api: APIRequestContext) {}

  ping(): Promise<APIResponse> {
    return this.api.get('/ping');
  }
}
