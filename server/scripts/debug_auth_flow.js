const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../db');
const bcrypt = require('bcryptjs'); // Use the same library as the app

async function testAuthFlow() {
    const testEmail = `test_${Date.now()}@example.com`;
    const testPass = 'Password123!';
    let client;

    try {
        console.log('--- Starting Auth Flow Test ---');
        console.log(`Using Email: ${testEmail}`);
        console.log(`Using Password: ${testPass}`);

        client = await pool.connect();

        // 1. Simulate Registration Hashing
        console.log('\n[1] Simulating Registration...');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(testPass, salt);
        console.log('Generated Hash:', passwordHash);

        // 2. Insert into DB
        const res = await client.query(
            'INSERT INTO sellers (email, password_hash) VALUES ($1, $2) RETURNING id',
            [testEmail, passwordHash]
        );
        const userId = res.rows[0].id;
        console.log(`User created with ID: ${userId}`);

        // 3. Simulate Login Retrieval
        console.log('\n[2] Simulating Login...');
        const userRes = await client.query('SELECT * FROM sellers WHERE email = $1', [testEmail]);

        if (userRes.rows.length === 0) {
            throw new Error('User NOT found in database after insertion!');
        }

        const storedHash = userRes.rows[0].password_hash;
        console.log('Stored Hash from DB:', storedHash);

        // 4. Compare Passwords
        const isValid = await bcrypt.compare(testPass, storedHash);
        console.log(`\nPassword Match Result: ${isValid}`);

        if (isValid) {
            console.log('SUCCESS: Registration and Login flow is working correctly on the server side.');
        } else {
            console.error('FAILURE: Bcrypt comparison failed!');
        }

    } catch (err) {
        console.error('Auth Test Failed:', err);
    } finally {
        if (client) client.release();
        pool.end();
    }
}

testAuthFlow();
