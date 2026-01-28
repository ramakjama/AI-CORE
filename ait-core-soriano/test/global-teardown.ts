import { execSync } from 'child_process';

export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');

  try {
    execSync('docker-compose -f docker-compose.test.yml down -v', {
      stdio: 'inherit',
    });

    console.log('✅ Test environment cleaned up');
  } catch (error) {
    console.error('Failed to cleanup test environment:', error);
  }
}
