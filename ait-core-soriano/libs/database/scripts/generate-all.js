#!/usr/bin/env node

/**
 * Generate Prisma clients for all databases
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('Generating Prisma clients for all databases...');

try {
  execSync('prisma generate', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });

  console.log('✅ Successfully generated all Prisma clients');
} catch (error) {
  console.error('❌ Failed to generate Prisma clients:', error.message);
  process.exit(1);
}
