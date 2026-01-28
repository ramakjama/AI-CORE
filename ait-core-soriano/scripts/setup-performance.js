#!/usr/bin/env node

/**
 * Performance Setup Script
 * Automated setup for performance optimizations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    log(`\n❌ Error executing: ${command}`, 'red');
    throw error;
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function copyFile(source, destination) {
  if (fileExists(destination)) {
    log(`  ⚠ File already exists: ${destination}`, 'yellow');
    return false;
  }
  fs.copyFileSync(source, destination);
  log(`  ✓ Created: ${destination}`, 'green');
  return true;
}

async function main() {
  log('\n🚀 AIT-CORE Performance Optimization Setup', 'bold');
  log('=' .repeat(60), 'cyan');

  const rootDir = path.resolve(__dirname, '..');

  // Step 1: Check Node.js version
  log('\n📋 Step 1: Checking prerequisites...', 'cyan');
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (major < 20) {
    log(`  ❌ Node.js 20+ required (found ${nodeVersion})`, 'red');
    process.exit(1);
  }
  log(`  ✓ Node.js version: ${nodeVersion}`, 'green');

  // Step 2: Install dependencies
  log('\n📦 Step 2: Installing dependencies...', 'cyan');
  const packageJson = require(path.join(rootDir, 'package.json'));
  const requiredDeps = [
    '@next/bundle-analyzer',
    'webpack-bundle-analyzer',
    'compression-webpack-plugin',
    'terser-webpack-plugin',
    'css-minimizer-webpack-plugin',
    'sharp',
    'redis',
    'axios',
  ];

  const missingDeps = requiredDeps.filter(
    dep => !packageJson.devDependencies || !packageJson.devDependencies[dep]
  );

  if (missingDeps.length > 0) {
    log(`  Installing missing dependencies: ${missingDeps.join(', ')}`, 'yellow');
    exec('pnpm install');
  } else {
    log('  ✓ All dependencies already installed', 'green');
  }

  // Step 3: Check configuration files
  log('\n⚙️  Step 3: Checking configuration files...', 'cyan');
  const configFiles = [
    'webpack.config.js',
    'performance.config.js',
    'cache.config.js',
    'cdn.config.js',
    '.babelrc',
    'vercel.json',
  ];

  let allConfigsExist = true;
  configFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fileExists(filePath)) {
      log(`  ✓ Found: ${file}`, 'green');
    } else {
      log(`  ❌ Missing: ${file}`, 'red');
      allConfigsExist = false;
    }
  });

  if (!allConfigsExist) {
    log('\n  ⚠ Some configuration files are missing.', 'yellow');
    log('  Please ensure all configuration files are present.', 'yellow');
  }

  // Step 4: Set up environment file
  log('\n🔐 Step 4: Setting up environment variables...', 'cyan');
  const envPerformance = path.join(rootDir, '.env.performance');
  const envProduction = path.join(rootDir, '.env.production');

  if (fileExists(envPerformance) && !fileExists(envProduction)) {
    copyFile(envPerformance, envProduction);
    log('  ⚠ Remember to update .env.production with your values!', 'yellow');
  } else if (fileExists(envProduction)) {
    log('  ✓ .env.production already exists', 'green');
  } else {
    log('  ⚠ .env.performance not found', 'yellow');
  }

  // Step 5: Check Redis (optional)
  log('\n💾 Step 5: Checking Redis...', 'cyan');
  try {
    exec('redis-cli ping', { stdio: 'pipe' });
    log('  ✓ Redis is running', 'green');
  } catch (error) {
    log('  ⚠ Redis not running (optional but recommended)', 'yellow');
    log('  To install Redis:', 'yellow');
    log('    - Docker: docker run -d -p 6379:6379 redis:alpine', 'yellow');
    log('    - Mac: brew install redis', 'yellow');
    log('    - Linux: apt-get install redis-server', 'yellow');
    log('    - Windows: https://github.com/microsoftarchive/redis/releases', 'yellow');
  }

  // Step 6: Create directories if needed
  log('\n📁 Step 6: Creating directories...', 'cyan');
  const directories = [
    path.join(rootDir, 'apps/web/public/static'),
    path.join(rootDir, 'apps/web/public/fonts'),
    path.join(rootDir, 'apps/admin/public/static'),
    path.join(rootDir, 'apps/admin/public/fonts'),
  ];

  directories.forEach(dir => {
    if (!fileExists(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`  ✓ Created: ${dir}`, 'green');
    }
  });

  // Step 7: Run optimizations
  log('\n🎨 Step 7: Running optimizations...', 'cyan');
  log('  Optimizing images...', 'cyan');
  try {
    exec('node scripts/optimize-images.js');
  } catch (error) {
    log('  ⚠ Image optimization skipped (run manually: pnpm run optimize:images)', 'yellow');
  }

  // Step 8: Build check
  log('\n🏗️  Step 8: Checking build configuration...', 'cyan');
  const nextConfigWeb = path.join(rootDir, 'apps/web/next.config.js');
  const nextConfigAdmin = path.join(rootDir, 'apps/admin/next.config.js');

  if (fileExists(nextConfigWeb)) {
    log('  ✓ apps/web/next.config.js configured', 'green');
  }
  if (fileExists(nextConfigAdmin)) {
    log('  ✓ apps/admin/next.config.js configured', 'green');
  }

  // Final summary
  log('\n' + '='.repeat(60), 'cyan');
  log('✅ Setup Complete!', 'bold');
  log('='.repeat(60), 'cyan');

  log('\n📝 Next Steps:', 'cyan');
  log('  1. Update .env.production with your configuration', 'yellow');
  log('  2. Configure CDN (Cloudflare or CloudFront)', 'yellow');
  log('  3. Set up Redis (optional but recommended)', 'yellow');
  log('  4. Run: pnpm run build:analyze', 'yellow');
  log('  5. Review bundle sizes: pnpm run analyze', 'yellow');
  log('  6. Deploy: vercel --prod', 'yellow');

  log('\n📚 Documentation:', 'cyan');
  log('  - Quick Start: PERFORMANCE_README.md', 'yellow');
  log('  - Complete Guide: PERFORMANCE_GUIDE.md', 'yellow');
  log('  - Checklist: PERFORMANCE_CHECKLIST.md', 'yellow');

  log('\n🎯 Performance Commands:', 'cyan');
  log('  pnpm run build:analyze      # Build with analysis', 'yellow');
  log('  pnpm run analyze            # Analyze bundles', 'yellow');
  log('  pnpm run optimize:images    # Optimize images', 'yellow');
  log('  pnpm run optimize:all       # Run all optimizations', 'yellow');

  log('\n🚀 Ready to optimize!\n', 'green');
}

main().catch(error => {
  log(`\n❌ Setup failed: ${error.message}`, 'red');
  process.exit(1);
});
