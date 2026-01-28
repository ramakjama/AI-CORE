#!/usr/bin/env node

/**
 * Security Report Generator
 * Generates comprehensive security reports from various scan results
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPORT_DIR = path.join(__dirname, '../security-reports');
const TIMESTAMP = new Date().toISOString().replace(/:/g, '-').split('.')[0];

// Ensure report directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

function runCommand(command, description) {
  console.log(`Running: ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    return { success: true, output };
  } catch (error) {
    return { success: false, output: error.stdout || error.stderr, error: error.message };
  }
}

function generateMarkdownReport() {
  let report = `# Security Report\n\n`;
  report += `**Generated**: ${new Date().toLocaleString()}\n\n`;
  report += `---\n\n`;

  // NPM Audit
  report += `## NPM Audit\n\n`;
  const auditResult = runCommand('npm audit --json', 'NPM Audit');
  if (auditResult.success) {
    try {
      const auditData = JSON.parse(auditResult.output);
      const vulnerabilities = auditData.metadata?.vulnerabilities || {};

      report += `### Summary\n\n`;
      report += `- **Critical**: ${vulnerabilities.critical || 0}\n`;
      report += `- **High**: ${vulnerabilities.high || 0}\n`;
      report += `- **Moderate**: ${vulnerabilities.moderate || 0}\n`;
      report += `- **Low**: ${vulnerabilities.low || 0}\n`;
      report += `- **Info**: ${vulnerabilities.info || 0}\n\n`;

      if ((vulnerabilities.critical || 0) + (vulnerabilities.high || 0) > 0) {
        report += `⚠️  **Action Required**: Critical or High vulnerabilities detected!\n\n`;
      } else {
        report += `✅ No critical or high vulnerabilities detected.\n\n`;
      }
    } catch (e) {
      report += `Error parsing audit results: ${e.message}\n\n`;
    }
  } else {
    report += `❌ NPM Audit failed to run.\n\n`;
  }

  // Outdated Packages
  report += `## Outdated Packages\n\n`;
  const outdatedResult = runCommand('npm outdated --json', 'Checking outdated packages');
  if (outdatedResult.success && outdatedResult.output.trim()) {
    try {
      const outdatedData = JSON.parse(outdatedResult.output);
      const outdatedCount = Object.keys(outdatedData).length;

      report += `Found ${outdatedCount} outdated packages.\n\n`;

      if (outdatedCount > 0) {
        report += `### Top 10 Outdated Packages\n\n`;
        Object.entries(outdatedData).slice(0, 10).forEach(([pkg, info]) => {
          report += `- **${pkg}**: ${info.current} → ${info.latest}\n`;
        });
        report += `\n`;
      }
    } catch (e) {
      report += `Error parsing outdated packages: ${e.message}\n\n`;
    }
  } else {
    report += `✅ All packages are up to date.\n\n`;
  }

  // License Check
  report += `## License Compliance\n\n`;
  const licenseResult = runCommand(
    'npx license-checker --production --summary --json',
    'License compliance check'
  );
  if (licenseResult.success) {
    try {
      const licenses = JSON.parse(licenseResult.output);
      report += `### License Summary\n\n`;
      Object.entries(licenses).forEach(([license, count]) => {
        report += `- **${license}**: ${count} packages\n`;
      });
      report += `\n`;
    } catch (e) {
      report += `Error parsing license data: ${e.message}\n\n`;
    }
  } else {
    report += `⚠️  Unable to generate license report.\n\n`;
  }

  // Security Best Practices
  report += `## Security Best Practices Check\n\n`;

  const checks = [
    {
      name: '.env file not committed',
      check: () => !fs.existsSync(path.join(__dirname, '../../.env')),
    },
    {
      name: '.env.example exists',
      check: () => fs.existsSync(path.join(__dirname, '../.env.security.example')),
    },
    {
      name: 'security.txt exists',
      check: () => fs.existsSync(path.join(__dirname, '../../../.well-known/security.txt')),
    },
    {
      name: 'Security configs present',
      check: () => {
        const configs = ['helmet.config.ts', 'cors.config.ts', 'rate-limit.config.ts', 'csp.config.ts'];
        return configs.every(file =>
          fs.existsSync(path.join(__dirname, '../src/config', file))
        );
      },
    },
  ];

  checks.forEach(({ name, check }) => {
    try {
      const passed = check();
      report += `- ${passed ? '✅' : '❌'} ${name}\n`;
    } catch (e) {
      report += `- ⚠️  ${name}: Error checking\n`;
    }
  });
  report += `\n`;

  // Recommendations
  report += `## Recommendations\n\n`;
  report += `1. Run \`npm audit fix\` to automatically fix vulnerabilities\n`;
  report += `2. Review and update outdated packages regularly\n`;
  report += `3. Keep security configurations up to date\n`;
  report += `4. Enable automated security scanning in CI/CD\n`;
  report += `5. Conduct regular security audits and penetration testing\n`;
  report += `6. Monitor security advisories for dependencies\n`;
  report += `7. Implement security training for development team\n\n`;

  // Next Steps
  report += `## Next Steps\n\n`;
  report += `- [ ] Review and fix all critical vulnerabilities\n`;
  report += `- [ ] Update packages with known security issues\n`;
  report += `- [ ] Schedule next security audit\n`;
  report += `- [ ] Update security documentation\n`;
  report += `- [ ] Verify security headers in production\n\n`;

  report += `---\n\n`;
  report += `*This report was automatically generated. For questions, contact security@sorianomediadore.com*\n`;

  return report;
}

function generateHTMLReport(markdownContent) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Report - ${new Date().toLocaleDateString()}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
            border-bottom: 1px solid #ecf0f1;
            padding-bottom: 8px;
        }
        h3 {
            color: #7f8c8d;
        }
        .status-ok { color: #27ae60; }
        .status-warning { color: #f39c12; }
        .status-error { color: #e74c3c; }
        .metadata {
            background: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        ul {
            list-style-type: none;
            padding-left: 0;
        }
        ul li {
            padding: 5px 0;
        }
        .summary-box {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .summary-item {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            border-left: 4px solid #3498db;
        }
        .summary-item.critical { border-left-color: #e74c3c; }
        .summary-item.high { border-left-color: #e67e22; }
        .summary-item.moderate { border-left-color: #f39c12; }
        .summary-item.low { border-left-color: #95a5a6; }
    </style>
</head>
<body>
    <div class="container">
        <pre>${markdownContent}</pre>
    </div>
</body>
</html>
`;
  return html;
}

// Generate reports
console.log('🔒 Generating Security Report...\n');

const markdownReport = generateMarkdownReport();
const htmlReport = generateHTMLReport(markdownReport);

// Save reports
const markdownPath = path.join(REPORT_DIR, `security-report-${TIMESTAMP}.md`);
const htmlPath = path.join(REPORT_DIR, `security-report-${TIMESTAMP}.html`);
const latestMdPath = path.join(REPORT_DIR, 'security-report-latest.md');
const latestHtmlPath = path.join(REPORT_DIR, 'security-report-latest.html');

fs.writeFileSync(markdownPath, markdownReport);
fs.writeFileSync(htmlPath, htmlReport);
fs.writeFileSync(latestMdPath, markdownReport);
fs.writeFileSync(latestHtmlPath, htmlReport);

console.log('✅ Security report generated successfully!\n');
console.log(`📄 Markdown: ${markdownPath}`);
console.log(`🌐 HTML: ${htmlPath}`);
console.log(`\n📝 Latest reports also saved to:`);
console.log(`   - ${latestMdPath}`);
console.log(`   - ${latestHtmlPath}`);
