/**
 * Migration Script: Fix Location Column Type
 * 
 * This script fixes the shops.location column to ensure compatibility
 * between GEOMETRY and GEOGRAPHY types.
 * 
 * Run this if you're experiencing "Error creating shop" issues after
 * migrating to Supabase.
 * 
 * Usage: node scripts/fix_location_column.js
 */

const pool = require('../db');

async function fixLocationColumn() {
  console.log('🔧 Starting location column type fix...\n');

  try {
    // Check current column type
    console.log('📋 Checking current location column type...');
    const checkType = await pool.query(`
      SELECT 
        column_name, 
        udt_name, 
        data_type
      FROM information_schema.columns
      WHERE table_name = 'shops' AND column_name = 'location'
    `);

    if (checkType.rows.length === 0) {
      console.error('❌ Error: shops table or location column does not exist!');
      console.log('   Please run the base schema setup first.');
      process.exit(1);
    }

    const currentType = checkType.rows[0].udt_name;
    console.log(`   Current type: ${currentType}`);

    // Check if column is GEOGRAPHY
    const isGeography = currentType === 'geography';
    
    if (isGeography) {
      console.log('\n⚠️  Location column is GEOGRAPHY type.');
      console.log('   Converting to GEOMETRY for better compatibility...\n');

      // Start transaction
      await pool.query('BEGIN');

      try {
        // Drop the location column
        console.log('   1. Backing up existing data...');
        await pool.query(`
          ALTER TABLE shops 
          ADD COLUMN location_temp GEOMETRY(POINT, 4326)
        `);

        // Copy data from GEOGRAPHY to GEOMETRY
        await pool.query(`
          UPDATE shops 
          SET location_temp = location::geometry
          WHERE location IS NOT NULL
        `);

        // Drop old column
        console.log('   2. Removing old GEOGRAPHY column...');
        await pool.query(`
          ALTER TABLE shops 
          DROP COLUMN location
        `);

        // Rename temp column
        console.log('   3. Creating new GEOMETRY column...');
        await pool.query(`
          ALTER TABLE shops 
          RENAME COLUMN location_temp TO location
        `);

        // Recreate spatial index
        console.log('   4. Recreating spatial index...');
        await pool.query(`
          DROP INDEX IF EXISTS idx_shops_location
        `);
        await pool.query(`
          CREATE INDEX idx_shops_location ON shops USING GIST(location)
        `);

        // Commit transaction
        await pool.query('COMMIT');
        console.log('\n✅ Successfully converted location column to GEOMETRY type!');
      } catch (err) {
        // Rollback on error
        await pool.query('ROLLBACK');
        throw err;
      }
    } else if (currentType === 'geometry') {
      console.log('\n✅ Location column is already GEOMETRY type - no changes needed!');
      
      // Just verify the spatial index exists
      console.log('\n📋 Verifying spatial index...');
      const checkIndex = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'shops' AND indexname = 'idx_shops_location'
      `);

      if (checkIndex.rows.length === 0) {
        console.log('   Creating missing spatial index...');
        await pool.query(`
          CREATE INDEX idx_shops_location ON shops USING GIST(location)
        `);
        console.log('   ✅ Spatial index created!');
      } else {
        console.log('   ✅ Spatial index exists!');
      }
    } else {
      console.error(`❌ Unexpected column type: ${currentType}`);
      console.log('   Please check your database schema.');
      process.exit(1);
    }

    console.log('\n🎉 Location column fix completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart your server: npm start');
    console.log('   2. Try creating a shop again');
    console.log('   3. If you still have issues, check the server logs for detailed errors\n');

  } catch (err) {
    console.error('\n❌ Error during migration:', err.message);
    console.error('\nFull error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
fixLocationColumn();
