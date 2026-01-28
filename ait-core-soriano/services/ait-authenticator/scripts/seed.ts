/**
 * Database Seed Script
 *
 * Loads seed data into the database
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

async function runSeeds() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Get all seed files
    const seedsDir = path.join(__dirname, '../seeds');

    if (!fs.existsSync(seedsDir)) {
      console.log('⚠️  Seeds directory not found');
      return;
    }

    const files = fs.readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure files run in order

    if (files.length === 0) {
      console.log('⚠️  No seed files found');
      return;
    }

    console.log(`Found ${files.length} seed file(s):\n`);

    // Run each seed
    for (const file of files) {
      const filePath = path.join(seedsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`📄 Running: ${file}`);

      try {
        await pool.query(sql);
        console.log(`✅ Success: ${file}\n`);
      } catch (error: any) {
        console.error(`❌ Failed: ${file}`);
        console.error(`Error: ${error.message}\n`);

        // Don't stop on error if seed has already been applied
        if (error.code === '23505') {
          // Unique violation (record already exists)
          console.log(`⚠️  Skipping ${file} (data already exists)\n`);
        } else {
          throw error;
        }
      }
    }

    console.log('✨ All seeds completed successfully!\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seeds
runSeeds();
