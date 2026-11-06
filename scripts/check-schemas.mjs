import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const schemaDir = 'schemas';
const collectionPath = 'postman/restful-booker.postman_collection.json';

const variableName = (schema) => `${schema.replace(/-(.)/g, (_, c) => c.toUpperCase())}Schema`;

const collection = JSON.parse(readFileSync(collectionPath, 'utf8'));
const embedded = new Map(collection.variable.map((entry) => [entry.key, entry.value]));

const files = readdirSync(schemaDir);
const drift = [];

for (const file of files) {
  const key = variableName(basename(file, '.json'));
  const inCollection = embedded.get(key);

  if (inCollection === undefined) {
    drift.push(`${key} is missing from the collection`);
    continue;
  }

  if (
    !isDeepStrictEqual(
      JSON.parse(inCollection),
      JSON.parse(readFileSync(join(schemaDir, file), 'utf8')),
    )
  ) {
    drift.push(`${key} no longer matches ${join(schemaDir, file)}`);
  }
}

if (drift.length > 0) {
  console.error(`The Postman collection has drifted from ${schemaDir}/:`);
  for (const line of drift) {
    console.error(`  ${line}`);
  }
  process.exit(1);
}

console.log(`${String(files.length)} schemas match the Postman collection.`);
