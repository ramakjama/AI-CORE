#!/usr/bin/env node

/**
 * AI-CORE - Script para crear todas las 81 bases de datos
 * 
 * Este script crea automáticamente todas las bases de datos necesarias
 * para el ecosistema AI-CORE
 */

const { Client } = require('pg');
const chalk = require('chalk');

// Lista completa de las 81 bases de datos
const DATABASES = {
  'Core (5)': [
    'ai_core_main',
    'ai_core_global',
    'ai_core_system',
    'ai_core_audit',
    'ai_core_logs',
  ],
  'Insurance (5)': [
    'ss_insurance',
    'ss_policies',
    'ss_claims',
    'ss_commissions',
    'ss_carriers',
  ],
  'HR (5)': [
    'sm_hr',
    'sm_hr_payroll',
    'sm_hr_recruitment',
    'sm_hr_training',
    'sm_hr_performance',
  ],
  'Analytics (4)': [
    'sm_analytics',
    'sm_analytics_reports',
    'sm_analytics_dashboards',
    'sm_analytics_metrics',
  ],
  'AI Agents (4)': [
    'sm_ai_agents',
    'sm_ai_models',
    'sm_ai_training',
    'sm_ai_prompts',
  ],
  'Communications (5)': [
    'sm_communications',
    'sm_comms_email',
    'sm_comms_sms',
    'sm_comms_whatsapp',
    'sm_comms_voice',
  ],
  'Finance (4)': [
    'sm_finance',
    'sm_finance_accounting',
    'sm_finance_invoicing',
    'sm_finance_treasury',
  ],
  'CRM (3)': [
    'sm_crm',
    'sm_leads',
    'sm_customers',
  ],
  'Documents (2)': [
    'sm_documents',
    'sm_storage',
  ],
  'Workflows (2)': [
    'sm_workflows',
    'sm_tasks',
  ],
  'Shared Ecosystem (8)': [
    'shared_sso',
    'shared_master_customers',
    'shared_master_products',
    'shared_unified_crm',
    'shared_unified_analytics',
    'shared_assets',
    'shared_global_config',
    'shared_event_bus',
  ],
  'Soriano Web (5)': [
    'soriano_web_main',
    'soriano_web_content',
    'soriano_web_blog',
    'soriano_web_forms',
    'soriano_web_seo',
  ],
  'e-SORI Portal (5)': [
    'esori_main',
    'esori_users',
    'esori_quotes',
    'esori_sessions',
    'esori_content',
  ],
  'Landing Pages (4)': [
    'landing_soriano_main',
    'landing_soriano_leads',
    'landing_soriano_analytics',
    'landing_soriano_campaigns',
  ],
  'Taxi Asegurado (5)': [
    'taxi_asegurado_main',
    'taxi_asegurado_leads',
    'taxi_asegurado_quotes',
    'taxi_asegurado_policies',
    'taxi_asegurado_analytics',
  ],
  'Extended Modules (10)': [
    'sm_inventory',
    'sm_products',
    'sm_projects',
    'sm_marketing',
    'sm_legal',
    'sm_compliance',
    'sm_quality',
    'sm_tickets',
    'sm_notifications',
    'sm_scheduling',
  ],
  'External Integrations (5)': [
    'ext_carriers',
    'ext_payments',
    'ext_maps',
    'ext_ai_models',
    'ext_backups',
  ],
};

async function createDatabase(client, dbName) {
  try {
    // Verificar si la base de datos ya existe
    const checkQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1
    `;
    const result = await client.query(checkQuery, [dbName]);

    if (result.rows.length > 0) {
      console.log(chalk.yellow(`  ⚠ ${dbName} ya existe (omitiendo)`));
      return { created: false, skipped: true };
    }

    // Crear la base de datos
    await client.query(`CREATE DATABASE ${dbName}`);
    console.log(chalk.green(`  ✓ ${dbName} creada`));
    return { created: true, skipped: false };
  } catch (error) {
    console.log(chalk.red(`  ✗ Error creando ${dbName}: ${error.message}`));
    return { created: false, skipped: false, error: true };
  }
}

async function main() {
  console.log(chalk.blue('\n╔═══════════════════════════════════════════════════╗'));
  console.log(chalk.blue('║  AI-CORE - Creación de Bases de Datos            ║'));
  console.log(chalk.blue('╚═══════════════════════════════════════════════════╝\n'));

  // Configuración de conexión
  const connectionString = process.env.DATABASE_URL || 
    'postgresql://postgres:password@localhost:5432/postgres';

  console.log(chalk.cyan('ℹ Conectando a PostgreSQL...'));
  console.log(chalk.gray(`  ${connectionString.replace(/:[^:@]+@/, ':****@')}\n`));

  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log(chalk.green('✓ Conectado a PostgreSQL\n'));

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Crear bases de datos por categoría
    for (const [category, databases] of Object.entries(DATABASES)) {
      console.log(chalk.blue(`\n${category}:`));
      
      for (const dbName of databases) {
        const result = await createDatabase(client, dbName);
        if (result.created) totalCreated++;
        if (result.skipped) totalSkipped++;
        if (result.error) totalErrors++;
      }
    }

    // Resumen
    console.log(chalk.blue('\n╔═══════════════════════════════════════════════════╗'));
    console.log(chalk.blue('║  Resumen                                          ║'));
    console.log(chalk.blue('╚═══════════════════════════════════════════════════╝\n'));
    console.log(chalk.green(`  ✓ Bases de datos creadas: ${totalCreated}`));
    console.log(chalk.yellow(`  ⚠ Bases de datos omitidas: ${totalSkipped}`));
    if (totalErrors > 0) {
      console.log(chalk.red(`  ✗ Errores: ${totalErrors}`));
    }
    console.log(chalk.cyan(`\n  Total: ${totalCreated + totalSkipped + totalErrors} / 81\n`));

  } catch (error) {
    console.error(chalk.red('\n✗ Error de conexión:'), error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Ejecutar
main().catch(console.error);
