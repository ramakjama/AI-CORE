/**
 * Database Migration Script
 *
 * Runs all SQL migration files in order
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'aitcore_dev',
  user: process.env.DB_USER || 'aitcore',
  password: process.env.DB_PASSWORD || 'dev_password'
});

async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...\n');

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure files run in order

    if (files.length === 0) {
      console.log('⚠️  No migration files found');
      return;
    }

    console.log(`Found ${files.length} migration file(s):\n`);

    // Run each migration
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`📄 Running: ${file}`);

      try {
        await pool.query(sql);
        console.log(`✅ Success: ${file}\n`);
      } catch (error: any) {
        console.error(`❌ Failed: ${file}`);
        console.error(`Error: ${error.message}\n`);

        // Don't stop on error if migration has already been applied
        if (error.code === '42P07') {
          // Table already exists
          console.log(`⚠️  Skipping ${file} (already applied)\n`);
        } else {
          throw error;
        }
      }
    }

    console.log('✨ All migrations completed successfully!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations();
