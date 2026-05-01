import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function collectTests(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTests(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

const testFiles = collectTests(resolve('tests'));

if (testFiles.length === 0) {
  console.error('No test files found under tests/.');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--experimental-specifier-resolution=node', '--test', '--test-isolation=none', ...testFiles], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
