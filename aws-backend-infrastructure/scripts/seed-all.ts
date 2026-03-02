#!/usr/bin/env node
/**
 * Master Seed Script
 * 
 * Runs all seeding scripts in the correct order:
 * 1. Seed users
 * 2. Seed farms
 * 3. Seed market prices
 * 
 * Usage:
 *   npm run seed:all -- --environment dev
 *   npm run seed:all -- --environment dev --users 5 --farms 10 --days 30
 * 
 * Requirements: 15.7
 */

import { spawn } from 'child_process';
import * as path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args.find(arg => arg.startsWith('--environment='))?.split('=')[1] || 'dev';
const userCount = args.find(arg => arg.startsWith('--users='))?.split('=')[1] || '3';
const farmCount = args.find(arg => arg.startsWith('--farms='))?.split('=')[1] || '3';
const days = args.find(arg => arg.startsWith('--days='))?.split('=')[1] || '30';

/**
 * Run a script and wait for it to complete
 */
function runScript(scriptName: string, scriptArgs: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${scriptName}`);
    console.log(`${'='.repeat(60)}\n`);
    
    const child = spawn('npx', ['ts-node', scriptPath, ...scriptArgs], {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${scriptName} exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Main function
 */
async function seedAll() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         AWS Backend Infrastructure - Seed All Data         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('Configuration:');
  console.log(`  Environment:  ${environment}`);
  console.log(`  Users:        ${userCount}`);
  console.log(`  Farms:        ${farmCount}`);
  console.log(`  Price Days:   ${days}`);
  console.log('');

  const startTime = Date.now();

  try {
    // Step 1: Seed users
    await runScript('seed-users.ts', [
      `--environment=${environment}`,
      `--count=${userCount}`,
    ]);

    // Step 2: Seed farms
    await runScript('seed-farms.ts', [
      `--environment=${environment}`,
      `--count=${farmCount}`,
    ]);

    // Step 3: Seed market prices
    await runScript('seed-market-prices.ts', [
      `--environment=${environment}`,
      `--days=${days}`,
    ]);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                   All Seeding Complete!                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`Total time: ${duration} seconds\n`);
    console.log('Next steps:');
    console.log('  1. Test authentication with seeded user credentials');
    console.log('  2. Query farms using the API');
    console.log('  3. Check market prices in the database');
    console.log('  4. Run integration tests\n');

  } catch (error: any) {
    console.error('\n╔════════════════════════════════════════════════════════════╗');
    console.error('║                    Seeding Failed!                         ║');
    console.error('╚════════════════════════════════════════════════════════════╝\n');
    console.error(`Error: ${error.message}\n`);
    process.exit(1);
  }
}

// Run the master script
seedAll();
