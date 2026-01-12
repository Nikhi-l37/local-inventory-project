#! /usr/bin/env node

/**
 * Troubleshooting Script for Supabase Connection
 * Run this script to diagnose database connection issues
 * 
 * Usage: node troubleshoot.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');

console.log('\n===========================================');
console.log('🔍 Supabase Connection Troubleshooting Tool');
console.log('===========================================\n');

// Step 1: Check environment variables
console.log('Step 1: Checking environment variables...');
const requiredVars = ['DATABASE_USER', 'DATABASE_HOST', 'DATABASE_NAME', 'DATABASE_PASSWORD', 'DATABASE_PORT'];
let envVarsOk = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`  ✗ ${varName}: NOT SET`);
    envVarsOk = false;
  } else {
    // Mask password
    const displayValue = varName === 'DATABASE_PASSWORD' 
      ? '*'.repeat(value.length) 
      : value;
    console.log(`  ✓ ${varName}: ${displayValue}`);
  }
});

if (!envVarsOk) {
  console.log('\n❌ Missing required environment variables!');
  console.log('Please check your .env file in the server directory.');
  process.exit(1);
}

console.log('\n✓ All environment variables are set\n');

// Step 2: Test DNS resolution
console.log('Step 2: Testing DNS resolution...');
const dns = require('dns');
dns.lookup(process.env.DATABASE_HOST, (err, address) => {
  if (err) {
    console.log(`  ✗ Cannot resolve host: ${process.env.DATABASE_HOST}`);
    console.log(`  Error: ${err.message}`);
    console.log('\n❌ DNS resolution failed!');
    console.log('This might be a network issue or incorrect host.');
    process.exit(1);
  } else {
    console.log(`  ✓ Host resolved to: ${address}\n`);
    
    // Step 3: Test database connection
    testDatabaseConnection();
  }
});

async function testDatabaseConnection() {
  console.log('Step 3: Testing database connection...');
  
  const isSupabase = process.env.DATABASE_HOST.includes('supabase.co');
  
  const poolConfig = {
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: parseInt(process.env.DATABASE_PORT),
    ssl: isSupabase ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  };
  
  console.log(`  Using port: ${poolConfig.port}`);
  console.log(`  SSL enabled: ${poolConfig.ssl ? 'Yes' : 'No'}`);
  
  const pool = new Pool(poolConfig);
  
  try {
    // Test 1: Basic connection
    console.log('\n  Test 1: Basic connection...');
    const result = await pool.query('SELECT NOW() as time, version() as version');
    console.log(`    ✓ Connected successfully`);
    console.log(`    Database time: ${result.rows[0].time}`);
    console.log(`    Version: ${result.rows[0].version.split('\n')[0]}`);
    
    // Test 2: Check PostGIS
    console.log('\n  Test 2: Checking PostGIS extension...');
    try {
      const postgis = await pool.query('SELECT PostGIS_version()');
      console.log(`    ✓ PostGIS is available: ${postgis.rows[0].postgis_version}`);
    } catch (err) {
      console.log(`    ✗ PostGIS NOT available: ${err.message}`);
      console.log('    Action required: Enable PostGIS in Supabase Dashboard');
    }
    
    // Test 3: Check pg_trgm
    console.log('\n  Test 3: Checking pg_trgm extension...');
    try {
      await pool.query("SELECT similarity('test', 'test')");
      console.log(`    ✓ pg_trgm is available`);
    } catch (err) {
      console.log(`    ✗ pg_trgm NOT available: ${err.message}`);
      console.log('    Action required: Enable pg_trgm in Supabase Dashboard');
    }
    
    // Test 4: Check tables
    console.log('\n  Test 4: Checking database schema...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tables.rows.length === 0) {
      console.log('    ⚠ No tables found in database');
      console.log('    Action required: Run migration scripts to create schema');
    } else {
      console.log('    ✓ Found tables:');
      const requiredTables = ['sellers', 'shops', 'products'];
      requiredTables.forEach(tableName => {
        const found = tables.rows.some(row => row.table_name === tableName);
        if (found) {
          console.log(`      ✓ ${tableName}`);
        } else {
          console.log(`      ✗ ${tableName} (MISSING)`);
        }
      });
      
      const missingTables = requiredTables.filter(
        tableName => !tables.rows.some(row => row.table_name === tableName)
      );
      
      if (missingTables.length > 0) {
        console.log('\n    ⚠ Missing required tables:', missingTables.join(', '));
        console.log('    Action required: Run migration scripts or create tables manually');
      }
    }
    
    // Test 5: Test connection pool
    console.log('\n  Test 5: Testing connection pool...');
    const queries = Array(5).fill(null).map(() => 
      pool.query('SELECT 1 as test')
    );
    await Promise.all(queries);
    console.log('    ✓ Connection pool working correctly');
    
    await pool.end();
    
    console.log('\n===========================================');
    console.log('✅ All tests passed!');
    console.log('===========================================\n');
    console.log('Your database connection is working properly.');
    console.log('You can now start the server with: npm start\n');
    
  } catch (err) {
    console.log(`\n    ✗ Connection failed: ${err.message}`);
    console.log(`    Error code: ${err.code || 'N/A'}`);
    
    console.log('\n===========================================');
    console.log('❌ Connection test failed!');
    console.log('===========================================\n');
    
    // Provide specific guidance based on error
    if (err.code === 'ECONNREFUSED') {
      console.log('Possible causes:');
      console.log('  • Wrong port number (try 5432 or 6543)');
      console.log('  • Firewall blocking connection');
      console.log('  • Supabase project is paused (check dashboard)');
    } else if (err.code === 'ETIMEDOUT') {
      console.log('Possible causes:');
      console.log('  • Network connectivity issues');
      console.log('  • Supabase project is down');
      console.log('  • Try using pooler mode (port 6543)');
    } else if (err.code === '28P01') {
      console.log('Possible causes:');
      console.log('  • Incorrect password');
      console.log('  • Check your .env file for typos');
    } else if (err.code === '3D000') {
      console.log('Possible causes:');
      console.log('  • Database name is incorrect');
      console.log('  • For Supabase, use "postgres" as database name');
    } else {
      console.log('Try the following:');
      console.log('  • Verify credentials in Supabase Dashboard');
      console.log('  • Check if Supabase project is active');
      console.log('  • Try switching between port 5432 and 6543');
      console.log('  • Check server logs for more details');
    }
    
    console.log('\n');
    await pool.end();
    process.exit(1);
  }
}
