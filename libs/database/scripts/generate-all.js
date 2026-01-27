const { spawnSync } = require('child_process');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const result = spawnSync('npx', ['prisma', 'generate', '--schema', schemaPath], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
