#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes bundle sizes and provides optimization recommendations
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

const THRESHOLDS = {
  js: {
    warning: 300000,  // 300KB
    error: 500000,    // 500KB
  },
  css: {
    warning: 100000,  // 100KB
    error: 150000,    // 150KB
  },
  image: {
    warning: 500000,  // 500KB
    error: 1000000,   // 1MB
  },
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function analyzeDirectory(dir, extension) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith(extension)) {
        files.push({
          path: fullPath.replace(dir, ''),
          size: stat.size,
        });
      }
    }
  }

  if (fs.existsSync(dir)) {
    traverse(dir);
  }

  return files;
}

function getStatus(size, type) {
  const threshold = THRESHOLDS[type];
  if (size >= threshold.error) return { status: 'error', color: 'red' };
  if (size >= threshold.warning) return { status: 'warning', color: 'yellow' };
  return { status: 'ok', color: 'green' };
}

function analyzeApp(appName, appPath) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Analyzing: ${appName}`, 'bold');
  log('='.repeat(60), 'cyan');

  const nextDir = path.join(appPath, '.next');

  if (!fs.existsSync(nextDir)) {
    log(`⚠ Build not found. Run 'npm run build' first.`, 'yellow');
    return;
  }

  // Analyze JavaScript
  log('\n📦 JavaScript Bundles:', 'cyan');
  const jsFiles = analyzeDirectory(path.join(nextDir, 'static/chunks'), '.js');
  let totalJs = 0;

  jsFiles.sort((a, b) => b.size - a.size).slice(0, 10).forEach(file => {
    totalJs += file.size;
    const { color } = getStatus(file.size, 'js');
    log(`  ${file.path}: ${formatBytes(file.size)}`, color);
  });

  log(`  Total JS: ${formatBytes(totalJs)}`, totalJs > THRESHOLDS.js.error ? 'red' : 'green');

  // Analyze CSS
  log('\n🎨 CSS Files:', 'cyan');
  const cssFiles = analyzeDirectory(path.join(nextDir, 'static/css'), '.css');
  let totalCss = 0;

  cssFiles.forEach(file => {
    totalCss += file.size;
    const { color } = getStatus(file.size, 'css');
    log(`  ${file.path}: ${formatBytes(file.size)}`, color);
  });

  log(`  Total CSS: ${formatBytes(totalCss)}`, totalCss > THRESHOLDS.css.error ? 'red' : 'green');

  // Analyze Images
  log('\n🖼️  Images:', 'cyan');
  const imageDir = path.join(appPath, 'public');
  if (fs.existsSync(imageDir)) {
    const images = [
      ...analyzeDirectory(imageDir, '.png'),
      ...analyzeDirectory(imageDir, '.jpg'),
      ...analyzeDirectory(imageDir, '.jpeg'),
      ...analyzeDirectory(imageDir, '.gif'),
      ...analyzeDirectory(imageDir, '.svg'),
      ...analyzeDirectory(imageDir, '.webp'),
    ];

    let totalImages = 0;
    images.sort((a, b) => b.size - a.size).slice(0, 10).forEach(file => {
      totalImages += file.size;
      const { color } = getStatus(file.size, 'image');
      log(`  ${file.path}: ${formatBytes(file.size)}`, color);
    });

    log(`  Total Images (top 10): ${formatBytes(totalImages)}`, totalImages > THRESHOLDS.image.error ? 'red' : 'green');
  }

  // Recommendations
  log('\n💡 Recommendations:', 'cyan');
  const recommendations = [];

  if (totalJs > THRESHOLDS.js.warning) {
    recommendations.push('• Consider code splitting and lazy loading for large JS bundles');
    recommendations.push('• Use dynamic imports for non-critical components');
    recommendations.push('• Review and remove unused dependencies');
  }

  if (totalCss > THRESHOLDS.css.warning) {
    recommendations.push('• Use CSS modules or CSS-in-JS for better tree shaking');
    recommendations.push('• Remove unused CSS with PurgeCSS');
  }

  const largeImages = analyzeDirectory(imageDir, '.png')
    .concat(analyzeDirectory(imageDir, '.jpg'))
    .filter(img => img.size > THRESHOLDS.image.warning);

  if (largeImages.length > 0) {
    recommendations.push('• Optimize images using next/image component');
    recommendations.push('• Convert images to WebP/AVIF format');
    recommendations.push('• Use appropriate image sizes for different viewports');
  }

  if (recommendations.length === 0) {
    log('  ✅ No major issues found!', 'green');
  } else {
    recommendations.forEach(rec => log(rec, 'yellow'));
  }
}

function main() {
  log('\n🔍 AIT-CORE Bundle Analyzer', 'bold');
  log('Starting bundle analysis...\n', 'cyan');

  const rootDir = path.resolve(__dirname, '..');
  const appsDir = path.join(rootDir, 'apps');

  // Analyze each app
  const apps = fs.readdirSync(appsDir).filter(app => {
    const appPath = path.join(appsDir, app);
    return fs.statSync(appPath).isDirectory() &&
           fs.existsSync(path.join(appPath, 'package.json'));
  });

  apps.forEach(app => {
    analyzeApp(app, path.join(appsDir, app));
  });

  log('\n✅ Analysis complete!', 'green');
  log('\nTo analyze in detail, run: ANALYZE=true npm run build\n', 'cyan');
}

main();
