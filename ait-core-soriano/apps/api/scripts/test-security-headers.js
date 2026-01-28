#!/usr/bin/env node

/**
 * Security Headers Test Script
 * Tests if all required security headers are properly configured
 */

const https = require('https');
const http = require('http');

const TEST_URL = process.env.TEST_URL || 'http://localhost:3000';

const REQUIRED_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': ['DENY', 'SAMEORIGIN'],
  'x-xss-protection': '1; mode=block',
  'strict-transport-security': /max-age=\d+/,
  'referrer-policy': /strict-origin/i,
  'content-security-policy': /.+/,
};

const FORBIDDEN_HEADERS = [
  'x-powered-by',
  'server',
];

function testSecurityHeaders(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    console.log(`Testing security headers for: ${url}\n`);

    protocol.get(url, (res) => {
      const results = {
        passed: [],
        failed: [],
        warnings: [],
      };

      // Check required headers
      for (const [header, expected] of Object.entries(REQUIRED_HEADERS)) {
        const value = res.headers[header];

        if (!value) {
          results.failed.push(`❌ Missing header: ${header}`);
          continue;
        }

        if (typeof expected === 'string') {
          if (value === expected) {
            results.passed.push(`✅ ${header}: ${value}`);
          } else {
            results.failed.push(`❌ ${header}: Expected "${expected}", got "${value}"`);
          }
        } else if (Array.isArray(expected)) {
          if (expected.includes(value)) {
            results.passed.push(`✅ ${header}: ${value}`);
          } else {
            results.failed.push(`❌ ${header}: Expected one of ${expected.join(', ')}, got "${value}"`);
          }
        } else if (expected instanceof RegExp) {
          if (expected.test(value)) {
            results.passed.push(`✅ ${header}: ${value}`);
          } else {
            results.failed.push(`❌ ${header}: Does not match pattern ${expected}`);
          }
        }
      }

      // Check forbidden headers
      for (const header of FORBIDDEN_HEADERS) {
        if (res.headers[header]) {
          results.warnings.push(`⚠️  Found forbidden header: ${header}: ${res.headers[header]}`);
        } else {
          results.passed.push(`✅ ${header} properly removed`);
        }
      }

      // Print results
      console.log('PASSED CHECKS:');
      results.passed.forEach(msg => console.log(msg));
      console.log('');

      if (results.warnings.length > 0) {
        console.log('WARNINGS:');
        results.warnings.forEach(msg => console.log(msg));
        console.log('');
      }

      if (results.failed.length > 0) {
        console.log('FAILED CHECKS:');
        results.failed.forEach(msg => console.log(msg));
        console.log('');
        console.log('❌ Security headers test FAILED');
        reject(new Error('Security headers test failed'));
      } else {
        console.log('✅ All security headers properly configured!');
        resolve(results);
      }
    }).on('error', (err) => {
      console.error('Error testing URL:', err.message);
      reject(err);
    });
  });
}

// Run the test
testSecurityHeaders(TEST_URL)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
