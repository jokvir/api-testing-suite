import { readdirSync, readFileSync } from 'node:fs';
import { expect as baseExpect } from '@playwright/test';
import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';

export type SchemaName = 'auth-token' | 'booking' | 'booking-ids' | 'created-booking';

const schemaDir = new URL('../schemas/', import.meta.url);
const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

for (const file of readdirSync(schemaDir)) {
  ajv.addSchema(JSON.parse(readFileSync(new URL(file, schemaDir), 'utf8')) as object);
}

export const expect = baseExpect.extend({
  toMatchSchema(received: unknown, name: SchemaName) {
    const validate = ajv.getSchema(name);
    if (!validate) throw new Error(`No schema named "${name}" in schemas/`);

    const pass = validate(received) === true;
    const details = (validate.errors ?? [])
      .map((error) => `  ${error.instancePath || '/'} ${error.message ?? ''}`)
      .join('\n');

    return {
      name: 'toMatchSchema',
      pass,
      message: () =>
        pass
          ? `Expected the payload not to match schema "${name}"`
          : `Payload does not match schema "${name}":\n${details}`,
    };
  },
});
