import { readdirSync } from 'node:fs';
import { join, sep, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

function collectTests(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTests(full));
    } else if (entry.isFile() && entry.name.endsWith('.test.ts')) {
      files.push(full);
    }
  }
  return files.sort();
}

const unitOnly = process.argv.includes('--unit');
const integrationOnly = process.argv.includes('--integration');

let testFiles = collectTests(__dirname);

if (unitOnly) {
  testFiles = testFiles.filter((f) => !f.includes(`${sep}integration${sep}`));
}
if (integrationOnly) {
  testFiles = testFiles.filter((f) => f.includes(`${sep}integration${sep}`));
}

if (testFiles.length === 0) {
  console.error('No test files found.');
  process.exit(1);
}

console.log(`Running ${testFiles.length} test file(s)...\n`);

const env = { ...process.env };
if (!integrationOnly && env['SKIP_INTEGRATION'] === undefined) {
  env['SKIP_INTEGRATION'] = 'true';
}

// tsx handles all TypeScript including NestJS legacy decorators + emitDecoratorMetadata
const tsxBin = join(dirname(fileURLToPath(import.meta.url)), '../node_modules/.bin/tsx');

const result = spawnSync(
  tsxBin,
  ['--test', '--experimental-test-isolation=none', ...testFiles],
  { stdio: 'inherit', env },
);

process.exit(result.status ?? 1);
