import { execSync } from 'child_process';

export default async function globalSetup() {
  console.log('🚀 Setting up test environment...');

  // Start test containers (Docker Compose)
  try {
    execSync('docker-compose -f docker-compose.test.yml up -d', {
      stdio: 'inherit',
    });

    // Wait for services to be ready
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('✅ Test environment ready');
  } catch (error) {
    console.error('Failed to start test environment:', error);
    throw error;
  }
}
