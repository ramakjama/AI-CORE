#!/usr/bin/env node

/**
 * Image Optimization Script
 * Optimizes images in the public directories
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function optimizeImage(inputPath, outputPath, options = {}) {
  const ext = path.extname(inputPath).toLowerCase();
  const originalSize = fs.statSync(inputPath).size;

  try {
    let pipeline = sharp(inputPath);

    // Resize if needed
    if (options.maxWidth) {
      pipeline = pipeline.resize(options.maxWidth, null, {
        withoutEnlargement: true,
        fit: 'inside',
      });
    }

    // Optimize based on format
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        pipeline = pipeline.jpeg({ quality: 85, progressive: true });
        break;
      case '.png':
        pipeline = pipeline.png({ quality: 85, compressionLevel: 9 });
        break;
      case '.webp':
        pipeline = pipeline.webp({ quality: 85 });
        break;
    }

    await pipeline.toFile(outputPath);

    const newSize = fs.statSync(outputPath).size;
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(2);

    return {
      success: true,
      originalSize,
      newSize,
      savings: parseFloat(savings),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function generateWebP(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .webp({ quality: 85 })
      .toFile(outputPath);
    return true;
  } catch (error) {
    log(`  ⚠ Failed to generate WebP: ${error.message}`, 'yellow');
    return false;
  }
}

async function generateAVIF(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .avif({ quality: 75 })
      .toFile(outputPath);
    return true;
  } catch (error) {
    log(`  ⚠ Failed to generate AVIF: ${error.message}`, 'yellow');
    return false;
  }
}

async function processDirectory(dir) {
  const results = {
    processed: 0,
    skipped: 0,
    errors: 0,
    totalSavings: 0,
    originalTotal: 0,
    newTotal: 0,
  };

  async function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        await traverse(fullPath);
      } else {
        const ext = path.extname(item).toLowerCase();
        if (['.jpg', '.jpeg', '.png'].includes(ext)) {
          const relativePath = fullPath.replace(dir, '');
          log(`\n📸 Processing: ${relativePath}`, 'cyan');

          // Optimize original
          const tempPath = fullPath + '.tmp';
          const result = await optimizeImage(fullPath, tempPath, {
            maxWidth: 2048,
          });

          if (result.success) {
            fs.renameSync(tempPath, fullPath);
            results.processed++;
            results.totalSavings += result.savings;
            results.originalTotal += result.originalSize;
            results.newTotal += result.newSize;

            log(`  ✓ Optimized: ${formatBytes(result.originalSize)} → ${formatBytes(result.newSize)} (${result.savings}% saved)`, 'green');

            // Generate WebP
            const webpPath = fullPath.replace(ext, '.webp');
            if (!fs.existsSync(webpPath)) {
              const webpSuccess = await generateWebP(fullPath, webpPath);
              if (webpSuccess) {
                const webpSize = fs.statSync(webpPath).size;
                log(`  ✓ Generated WebP: ${formatBytes(webpSize)}`, 'green');
              }
            }

            // Generate AVIF (optional, slower)
            if (process.env.GENERATE_AVIF === 'true') {
              const avifPath = fullPath.replace(ext, '.avif');
              if (!fs.existsSync(avifPath)) {
                const avifSuccess = await generateAVIF(fullPath, avifPath);
                if (avifSuccess) {
                  const avifSize = fs.statSync(avifPath).size;
                  log(`  ✓ Generated AVIF: ${formatBytes(avifSize)}`, 'green');
                }
              }
            }
          } else {
            results.errors++;
            log(`  ✗ Error: ${result.error}`, 'yellow');
          }
        }
      }
    }
  }

  await traverse(dir);
  return results;
}

async function main() {
  log('\n🎨 AIT-CORE Image Optimizer', 'bold');
  log('Starting image optimization...\n', 'cyan');

  const rootDir = path.resolve(__dirname, '..');
  const appsDir = path.join(rootDir, 'apps');

  const apps = fs.readdirSync(appsDir).filter(app => {
    const appPath = path.join(appsDir, app);
    return fs.statSync(appPath).isDirectory();
  });

  let totalProcessed = 0;
  let totalSavings = 0;
  let totalOriginal = 0;
  let totalNew = 0;

  for (const app of apps) {
    const publicDir = path.join(appsDir, app, 'public');

    if (fs.existsSync(publicDir)) {
      log(`\n${'='.repeat(60)}`, 'cyan');
      log(`Optimizing: ${app}`, 'bold');
      log('='.repeat(60), 'cyan');

      const results = await processDirectory(publicDir);

      totalProcessed += results.processed;
      totalOriginal += results.originalTotal;
      totalNew += results.newTotal;

      log(`\n📊 Results for ${app}:`, 'cyan');
      log(`  Processed: ${results.processed}`, 'green');
      log(`  Errors: ${results.errors}`, results.errors > 0 ? 'yellow' : 'green');
      log(`  Original size: ${formatBytes(results.originalTotal)}`, 'cyan');
      log(`  New size: ${formatBytes(results.newTotal)}`, 'cyan');

      if (results.originalTotal > 0) {
        const savings = ((results.originalTotal - results.newTotal) / results.originalTotal * 100).toFixed(2);
        log(`  Savings: ${savings}%`, 'green');
      }
    }
  }

  log('\n' + '='.repeat(60), 'cyan');
  log('📊 Overall Results:', 'bold');
  log('='.repeat(60), 'cyan');
  log(`Total images processed: ${totalProcessed}`, 'green');
  log(`Total original size: ${formatBytes(totalOriginal)}`, 'cyan');
  log(`Total new size: ${formatBytes(totalNew)}`, 'cyan');

  if (totalOriginal > 0) {
    const overallSavings = ((totalOriginal - totalNew) / totalOriginal * 100).toFixed(2);
    log(`Total savings: ${overallSavings}% (${formatBytes(totalOriginal - totalNew)})`, 'green');
  }

  log('\n✅ Optimization complete!', 'green');
  log('\nTip: Set GENERATE_AVIF=true to also generate AVIF formats\n', 'cyan');
}

// Check if sharp is installed
try {
  require.resolve('sharp');
  main().catch(error => {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  });
} catch (e) {
  log('\n❌ Error: sharp is not installed', 'red');
  log('Install it with: npm install sharp --save-dev\n', 'yellow');
  process.exit(1);
}
