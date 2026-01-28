#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Module Generator Script
 *
 * Generates a complete AIT module from templates with:
 * - Package.json with NestJS 11
 * - PrismaService
 * - Base controller
 * - Base service
 * - DTOs
 * - Module config
 * - Agent configuration (100 parallel agents, switch/edit/plain/bypass modes)
 */

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates', 'module');
const MODULES_BASE_DIR = path.join(__dirname, '..', 'modules');

const CATEGORIES = {
  '1': { dir: '01-core-business', name: 'Core Business' },
  '2': { dir: '02-insurance-specialized', name: 'Insurance Specialized' },
  '3': { dir: '03-marketing-sales', name: 'Marketing & Sales' },
  '4': { dir: '04-analytics-intelligence', name: 'Analytics & Intelligence' },
  '5': { dir: '05-security-compliance', name: 'Security & Compliance' },
  '6': { dir: '06-infrastructure', name: 'Infrastructure' },
  '7': { dir: '07-integration-automation', name: 'Integration & Automation' }
};

function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function toPascalCase(str) {
  return str
    .replace(/[-_\s](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toUpperSnakeCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]/g, '_')
    .toUpperCase();
}

function replaceTemplateVars(content, vars) {
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

function processTemplate(templatePath, outputPath, vars) {
  let content = fs.readFileSync(templatePath, 'utf8');
  content = replaceTemplateVars(content, vars);

  // Replace filename variables
  let finalOutputPath = outputPath;
  finalOutputPath = finalOutputPath.replace(/{{MODULE_NAME}}/g, vars.MODULE_NAME_KEBAB);
  finalOutputPath = finalOutputPath.replace(/{{MODULE_NAME_KEBAB}}/g, vars.MODULE_NAME_KEBAB);
  finalOutputPath = finalOutputPath.replace(/{{ENTITY_NAME_KEBAB}}/g, vars.ENTITY_NAME_KEBAB);

  const dir = path.dirname(finalOutputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(finalOutputPath, content);
  console.log(`✅ Created: ${finalOutputPath}`);
}

function copyDirectory(src, dest, vars) {
  if (!fs.existsSync(src)) {
    console.warn(`⚠️  Template directory not found: ${src}`);
    return;
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Replace directory name variables
      destPath = destPath.replace(/{{MODULE_NAME}}/g, vars.MODULE_NAME_KEBAB);
      copyDirectory(srcPath, destPath, vars);
    } else if (entry.name.endsWith('.template')) {
      // Process template file
      destPath = destPath.replace('.template', '');
      processTemplate(srcPath, destPath, vars);
    } else {
      // Copy file as-is
      if (!fs.existsSync(path.dirname(destPath))) {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
      }
      fs.copyFileSync(srcPath, destPath);
      console.log(`📄 Copied: ${destPath}`);
    }
  }
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏗️  AIT MODULE GENERATOR                                ║
║   Create complete modules with templates                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Get module details
  const moduleName = await question('Module name (e.g., ait-treasury): ');
  const moduleNameClean = moduleName.replace(/^ait-/, '');

  const description = await question('Module description: ');

  console.log('\nCategories:');
  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    console.log(`  ${key}. ${cat.name}`);
  });
  const categoryNum = await question('Category (1-7): ');
  const category = CATEGORIES[categoryNum];

  if (!category) {
    console.error('❌ Invalid category');
    rl.close();
    return;
  }

  const entityName = await question('Main entity name (e.g., Payment, Invoice): ');
  const port = await question('Port number (e.g., 3005): ');

  const keywords = await question('Keywords (comma-separated): ');
  const priority = await question('Priority (low/medium/high/critical): ') || 'medium';

  const icon = await question('Icon emoji (e.g., 💰): ') || '📦';
  const color = await question('Color (hex, e.g., #4CAF50): ') || '#2196F3';

  // Prepare variables
  const vars = {
    MODULE_NAME: moduleName,
    MODULE_NAME_KEBAB: toKebabCase(moduleName),
    MODULE_NAME_PASCAL: toPascalCase(moduleNameClean),
    MODULE_NAME_CAMEL: toCamelCase(moduleNameClean),
    MODULE_NAME_UPPER: toUpperSnakeCase(moduleName),
    MODULE_ID: toKebabCase(moduleName),
    MODULE_DESCRIPTION: description,
    MODULE_TAG: moduleNameClean,
    MODULE_ROUTE: toKebabCase(moduleNameClean),

    ENTITY_NAME: entityName,
    ENTITY_NAME_PASCAL: toPascalCase(entityName),
    ENTITY_NAME_CAMEL: toCamelCase(entityName),
    ENTITY_NAME_KEBAB: toKebabCase(entityName),
    ENTITY_NAME_PLURAL: entityName + 's',

    CATEGORY: category.dir,
    PORT: port,
    KEYWORDS: keywords,
    PRIORITY: priority,
    ICON: icon,
    COLOR: color,
    DATABASE_NAME: `${toKebabCase(moduleNameClean)}_db`,

    // Placeholders for lists
    REQUIRED_DEPS: '"ait-authenticator", "ait-pgc-engine"',
    OPTIONAL_DEPS: '',
    CAPABILITIES: '"crud", "search", "export"',
    FEATURES_LIST: '- CRUD operations\n * - Validation\n * - Error handling',
    DEPENDENCIES_LIST: '- AIT-AUTHENTICATOR (required)\n * - AIT-PGC-ENGINE (required)',

    // Field examples (can be expanded)
    FIELD_1_NAME: 'name',
    FIELD_1_DESCRIPTION: 'Name',
    FIELD_1_EXAMPLE: 'Example name',
    FIELD_2_NAME: 'description',
    FIELD_2_DESCRIPTION: 'Description',
    FIELD_2_EXAMPLE: 'Example description',
  };

  // Create module directory
  const moduleDir = path.join(MODULES_BASE_DIR, category.dir, toKebabCase(moduleName));

  if (fs.existsSync(moduleDir)) {
    const overwrite = await question(`⚠️  Module already exists. Overwrite? (y/n): `);
    if (overwrite.toLowerCase() !== 'y') {
      console.log('❌ Cancelled');
      rl.close();
      return;
    }
  }

  console.log(`\n🔨 Generating module: ${moduleName}`);
  console.log(`📂 Location: ${moduleDir}\n`);

  // Copy and process templates
  copyDirectory(TEMPLATES_DIR, moduleDir, vars);

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ✅ Module generated successfully!                       ║
║                                                           ║
║   📂 ${moduleDir}
║                                                           ║
║   Next steps:                                             ║
║   1. cd ${moduleDir}
║   2. Review and customize generated files                 ║
║   3. Define Prisma schema in prisma/schema.prisma         ║
║   4. Run: pnpm install                                    ║
║   5. Run: pnpm prisma:generate                            ║
║   6. Run: pnpm start:dev                                  ║
║                                                           ║
║   📦 Features included:                                   ║
║   - NestJS 11 + Prisma 6                                  ║
║   - 100 parallel agents support                           ║
║   - Switch/Edit/Plain/Bypass modes                        ║
║   - CRUD operations                                       ║
║   - Swagger documentation                                 ║
║   - Health check endpoint                                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  rl.close();
}

main().catch(error => {
  console.error('❌ Error:', error);
  rl.close();
  process.exit(1);
});
