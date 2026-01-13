const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../db');

async function debugCreateShop() {
    let client;
    try {
        console.log('--- Starting Shop Creation Debug ---');

        // 1. Get a valid seller ID
        const userRes = await pool.query('SELECT id FROM sellers LIMIT 1');
        if (userRes.rows.length === 0) {
            throw new Error('No sellers found. Cannot test shop creation.');
        }
        const sellerId = userRes.rows[0].id;
        console.log(`Using Seller ID: ${sellerId}`);

        client = await pool.connect();

        // 2. Prepare mock data similar to what the UI sends
        const shopData = {
            seller_id: sellerId,
            name: 'Debug Shop',
            category: 'Grocery',
            latitude: 14.4426,
            longitude: 79.9865,
            town_village: 'Nellore',
            mandal: 'Nellore',
            district: 'Nellore',
            state: 'Andhra Pradesh',
            description: 'A test shop created via debug script.',
            opening_time: '09:00',
            closing_time: '21:00',
            image_url: null
        };

        console.log('Attempting to create shop with data:', parseInt);

        const locationString = `POINT(${shopData.longitude} ${shopData.latitude})`;

        // 3. Execute the exact INSERT query from shop.js
        const newShop = await client.query(
            `INSERT INTO shops (
         seller_id, name, category, location, 
         town_village, mandal, district, state,
         description, opening_time, closing_time, image_url
       ) 
       VALUES ($1, $2, $3, ST_GeomFromText($4, 4326), $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING id, name`,
            [
                shopData.seller_id, shopData.name, shopData.category, locationString,
                shopData.town_village, shopData.mandal, shopData.district, shopData.state,
                shopData.description, shopData.opening_time, shopData.closing_time, shopData.image_url
            ]
        );

        console.log('SUCCESS: Shop created!', newShop.rows[0]);

        // Cleanup: Delete the debug shop
        await client.query('DELETE FROM shops WHERE id = $1', [newShop.rows[0].id]);
        console.log('Cleanup: Debug shop deleted.');

    } catch (err) {
        console.error('Shop Creation FAILED:', err.message);
        // console.error(err); // Full error might be noisy but useful
    } finally {
        if (client) client.release();
        pool.end();
    }
}

debugCreateShop();
