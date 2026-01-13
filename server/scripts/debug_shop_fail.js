const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../db');

async function debugShopFail() {
    let client;
    try {
        console.log('--- Starting Shop Creation Crash Test ---');

        // 1. Get a valid seller ID
        const userRes = await pool.query('SELECT id FROM sellers LIMIT 1');
        const sellerId = userRes.rows[0].id; // 1

        // 2. Mock Data EXACTLY as it comes from FormData (Strings)
        const name = 'Jeevan';
        const category = 'Grocery';
        const latitude = '14.468591';   // STRING
        const longitude = '79.979095';  // STRING
        const town_village = 'Potireddipalem';
        const mandal = 'Kovur';
        const district = 'Nellore';     // Simplified
        const state = 'Andhra Pradesh';
        const description = '';         // EMPTY STRING
        const opening_time = '09:00';
        const closing_time = '21:00';
        const image_url = null;

        client = await pool.connect();

        console.log('Attempting INSERT with STRING coordinates...');

        // Exact query from shop.js
        const newShop = await client.query(
            `INSERT INTO shops (
         seller_id, name, category, location, 
         town_village, mandal, district, state,
         description, opening_time, closing_time, image_url
       ) 
       VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING id, name`,
            [
                sellerId, name, category, longitude, latitude,
                town_village, mandal, district, state,
                description, opening_time, closing_time, image_url
            ]
        );

        console.log('SUCCESS: Shop created!', newShop.rows[0]);

        // Cleanup
        await client.query('DELETE FROM shops WHERE id = $1', [newShop.rows[0].id]);

    } catch (err) {
        console.error('CRASH REPRODUCED:', err.message);
        // console.error(err);
    } finally {
        if (client) client.release();
        pool.end();
    }
}

debugShopFail();
