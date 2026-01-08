const express = require('express');
const router = express.Router();
const pool = require('./db');
const auth = require('./middleware/auth');
const upload = require('./middleware/uploadMiddleware');
const {
  validateCreateCategory,
  validateIdParam
} = require('./middleware/validation');

// ROUTE: POST /api/categories
// PURPOSE: Create a new category for a shop
// ACCESS: Private (Seller)
router.post('/', [auth, validateCreateCategory, upload.single('image')], async (req, res) => {
    try {
        const { name, description } = req.body;
        const sellerId = req.sellerId;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        // 1. Get Shop ID
        const shopResult = await pool.query('SELECT id FROM shops WHERE seller_id = $1', [sellerId]);
        if (shopResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Shop not found' });
        }
        const shopId = shopResult.rows[0].id;

        // 2. Insert Category
        const newCategory = await pool.query(
            `INSERT INTO categories (shop_id, name, description, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [shopId, name, description, image_url]
        );

        res.json(newCategory.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ROUTE: GET /api/categories/shop/:shopId
// PURPOSE: Get all categories for a specific shop
// ACCESS: Public
router.get('/shop/:shopId', validateIdParam('shopId'), async (req, res) => {
    try {
        const { shopId } = req.params;
        const categories = await pool.query(
            'SELECT * FROM categories WHERE shop_id = $1 ORDER BY name',
            [shopId]
        );
        res.json(categories.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ROUTE: GET /api/categories/my-shop
// PURPOSE: Get all categories for the logged-in seller's shop
// ACCESS: Private (Seller)
router.get('/my-shop', auth, async (req, res) => {
    try {
        const sellerId = req.sellerId;

        // Join with shops to ensure seller owns the shop
        const categories = await pool.query(
            `SELECT c.* 
       FROM categories c
       JOIN shops s ON c.shop_id = s.id
       WHERE s.seller_id = $1
       ORDER BY c.name`,
            [sellerId]
        );

        res.json(categories.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// ROUTE: DELETE /api/categories/:id
// PURPOSE: Delete a category
// ACCESS: Private (Seller)
router.delete('/:id', [auth, validateIdParam('id')], async (req, res) => {
    try {
        const { id } = req.params;
        const sellerId = req.sellerId;

        // Check ownership
        const check = await pool.query(
            `SELECT c.id FROM categories c 
       JOIN shops s ON c.shop_id = s.id 
       WHERE c.id = $1 AND s.seller_id = $2`,
            [id, sellerId]
        );

        if (check.rows.length === 0) {
            return res.status(403).json({ msg: 'Not authorized or category not found' });
        }

        await pool.query('DELETE FROM categories WHERE id = $1', [id]);
        res.json({ msg: 'Category deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
