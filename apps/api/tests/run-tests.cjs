const { readdirSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const testsDir = __dirname;
const testFiles = readdirSync(testsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.test.ts'))
  .map((entry) => join(testsDir, entry.name))
  .sort();

const result = spawnSync(process.execPath, ['--experimental-strip-types', '--test', '--test-isolation=none', ...testFiles], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
