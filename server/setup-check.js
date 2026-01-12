#!/usr/bin/env node

/**
 * Quick Setup Verification Script
 * Checks if environment is ready to run the application
 */

const fs = require('fs');
const path = require('path');

console.log('\n========================================');
console.log('🚀 Local Inventory Server Setup Check');
console.log('========================================\n');

let allChecksPass = true;

// Check 1: Node version
console.log('1. Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].slice(1));
if (majorVersion >= 16) {
  console.log(`   ✓ Node.js ${nodeVersion} (minimum v16 required)\n`);
} else {
  console.log(`   ✗ Node.js ${nodeVersion} is too old (minimum v16 required)\n`);
  allChecksPass = false;
}

// Check 2: .env file exists
console.log('2. Checking for .env file...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('   ✓ .env file exists\n');
} else {
  console.log('   ✗ .env file not found');
  console.log('   Action: Copy .env.example to .env and fill in your credentials\n');
  allChecksPass = false;
}

// Check 3: node_modules exists
console.log('3. Checking for dependencies...');
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('   ✓ node_modules exists\n');
} else {
  console.log('   ✗ node_modules not found');
  console.log('   Action: Run "npm install" to install dependencies\n');
  allChecksPass = false;
}

// Check 4: Load and validate .env
if (fs.existsSync(envPath)) {
  console.log('4. Validating environment variables...');
  require('dotenv').config({ path: envPath });
  
  const requiredVars = {
    'DATABASE_USER': 'Database username',
    'DATABASE_HOST': 'Database host',
    'DATABASE_NAME': 'Database name',
    'DATABASE_PASSWORD': 'Database password',
    'DATABASE_PORT': 'Database port',
    'JWT_SECRET': 'JWT secret key'
  };
  
  let envVarsValid = true;
  for (const [varName, description] of Object.entries(requiredVars)) {
    const value = process.env[varName];
    if (!value || value === '' || value.includes('your_') || value.includes('change_this')) {
      console.log(`   ✗ ${varName}: Not set or using placeholder`);
      envVarsValid = false;
    }
  }
  
  if (envVarsValid) {
    console.log('   ✓ All required environment variables are set\n');
  } else {
    console.log('   Action: Update .env with your actual credentials\n');
    allChecksPass = false;
  }
} else {
  console.log('4. Skipping environment validation (no .env file)\n');
}

// Check 5: Required directories
console.log('5. Checking required directories...');
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('   ✓ Created uploads directory\n');
} else {
  console.log('   ✓ uploads directory exists\n');
}

// Check 6: Critical files
console.log('6. Checking critical files...');
const criticalFiles = [
  'index.js',
  'db.js',
  'package.json',
  'auth.js',
  'shop.js',
  'product.js',
  'search.js'
];

let filesOk = true;
for (const file of criticalFiles) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`   ✗ Missing: ${file}`);
    filesOk = false;
  }
}

if (filesOk) {
  console.log('   ✓ All critical files present\n');
} else {
  console.log('   Action: Restore missing files from repository\n');
  allChecksPass = false;
}

// Summary
console.log('========================================');
if (allChecksPass) {
  console.log('✅ Setup check passed!');
  console.log('========================================\n');
  console.log('Next steps:');
  console.log('1. Run "npm run troubleshoot" to test database connection');
  console.log('2. If connection fails, check Supabase dashboard');
  console.log('3. Run migrations: npm run migrate:v3 && npm run migrate:search');
  console.log('4. Start server: npm start\n');
  console.log('For detailed setup guide, see: README.md');
  console.log('For Supabase migration: See ../SUPABASE_MIGRATION.md\n');
} else {
  console.log('❌ Setup check failed!');
  console.log('========================================\n');
  console.log('Please fix the issues above and run this script again.\n');
  process.exit(1);
}
