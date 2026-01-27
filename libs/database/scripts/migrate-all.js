const { spawnSync } = require('child_process');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const migrationName = process.env.MIGRATION_NAME || 'init';

const result = spawnSync(
  'npx',
  ['prisma', 'migrate', 'dev', '--name', migrationName, '--schema', schemaPath],
  { stdio: 'inherit' }
);

process.exit(result.status ?? 1);
