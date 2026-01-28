/**
 * Run Benchmarks Script
 * Purpose: Execute performance benchmarks and generate comparison reports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '..', 'reports');
const BENCHMARKS_DIR = path.join(REPORTS_DIR, 'benchmarks');

// Ensure directories exist
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}
if (!fs.existsSync(BENCHMARKS_DIR)) {
  fs.mkdirSync(BENCHMARKS_DIR, { recursive: true });
}

const benchmarks = [
  {
    name: 'Auth Service Benchmark',
    script: 'tests/api/auth-api-test.js',
    duration: '5m',
    vus: 50,
  },
  {
    name: 'Gateway Benchmark',
    script: 'tests/api/gateway-test.js',
    duration: '5m',
    vus: 100,
  },
  {
    name: 'Load Test Benchmark',
    script: 'tests/load-test.js',
    duration: '10m',
    vus: 100,
  },
];

function runBenchmark(benchmark) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${benchmark.name}`);
  console.log(`Script: ${benchmark.script}`);
  console.log(`Duration: ${benchmark.duration} | VUs: ${benchmark.vus}`);
  console.log('='.repeat(60));

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = path.join(
    BENCHMARKS_DIR,
    `${benchmark.name.toLowerCase().replace(/\s/g, '-')}-${timestamp}.json`
  );

  try {
    const command = `k6 run --out json=${outputFile} ${benchmark.script}`;
    execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });

    console.log(`✓ Benchmark completed: ${benchmark.name}`);
    console.log(`  Results saved to: ${outputFile}`);

    return {
      benchmark: benchmark.name,
      status: 'success',
      outputFile,
      timestamp,
    };
  } catch (error) {
    console.error(`✗ Benchmark failed: ${benchmark.name}`);
    console.error(error.message);

    return {
      benchmark: benchmark.name,
      status: 'failed',
      error: error.message,
      timestamp,
    };
  }
}

function generateBenchmarkReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    total_benchmarks: results.length,
    successful: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'failed').length,
    results: results,
  };

  const reportFile = path.join(
    BENCHMARKS_DIR,
    `benchmark-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  );

  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

  console.log(`\n${'='.repeat(60)}`);
  console.log('BENCHMARK SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Benchmarks: ${report.total_benchmarks}`);
  console.log(`Successful: ${report.successful}`);
  console.log(`Failed: ${report.failed}`);
  console.log(`Report: ${reportFile}`);
  console.log('='.repeat(60));

  return report;
}

function compareBenchmarks() {
  console.log('\nComparing with previous benchmarks...');

  const benchmarkFiles = fs
    .readdirSync(BENCHMARKS_DIR)
    .filter(f => f.endsWith('.json') && f.includes('benchmark-report'))
    .sort()
    .reverse();

  if (benchmarkFiles.length < 2) {
    console.log('Not enough benchmark data for comparison');
    return;
  }

  const latest = JSON.parse(
    fs.readFileSync(path.join(BENCHMARKS_DIR, benchmarkFiles[0]))
  );
  const previous = JSON.parse(
    fs.readFileSync(path.join(BENCHMARKS_DIR, benchmarkFiles[1]))
  );

  console.log('\nLatest:', new Date(latest.timestamp).toLocaleString());
  console.log('Previous:', new Date(previous.timestamp).toLocaleString());

  // Simple comparison
  const comparison = {
    timestamp: new Date().toISOString(),
    latest_run: latest.timestamp,
    previous_run: previous.timestamp,
    improvements: latest.successful - previous.successful,
    regressions: latest.failed - previous.failed,
  };

  console.log('\nComparison:');
  console.log(`  Improvements: ${comparison.improvements > 0 ? '+' : ''}${comparison.improvements}`);
  console.log(`  Regressions: ${comparison.regressions > 0 ? '+' : ''}${comparison.regressions}`);

  return comparison;
}

// Main execution
console.log('Starting Performance Benchmarks...');
console.log(`Reports Directory: ${BENCHMARKS_DIR}\n`);

const results = [];

for (const benchmark of benchmarks) {
  const result = runBenchmark(benchmark);
  results.push(result);
}

const report = generateBenchmarkReport(results);
compareBenchmarks();

console.log('\n✓ All benchmarks completed\n');

process.exit(report.failed > 0 ? 1 : 0);
