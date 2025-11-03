const express = require('express');
const router = express.Router();
const pool = require('./db');
const auth = require('./middleware/auth'); // Our auth middleware

// ROUTE: POST /api/products
// PURPOSE: To add a new product to a seller's shop
// ACCESS: Private (requires token)
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body; // FIXED: Removed shopId from destructuring (Issue 5)
    const sellerId = req.sellerId; // From auth middleware

    // 1. Get the shopId for the currently logged-in seller securely
    const shopResult = await pool.query('SELECT id FROM shops WHERE seller_id = $1', [sellerId]);

    if (shopResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Seller does not have a registered shop.' });
    }
    const shopId = shopResult.rows[0].id; // Get the shopId securely from the DB

    // If they own it, add the product
    const newProduct = await pool.query(
      'INSERT INTO products (shop_id, name) VALUES ($1, $2) RETURNING *',
      [shopId, name] // Use the securely fetched shopId
    );

    res.json(newProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ROUTE: PATCH /api/products/:productId
// PURPOSE: To update a product's availability (Available / Not Available)
// ACCESS: Private (requires token)
router.patch('/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { is_available } = req.body; // The new status (true or false)
    const sellerId = req.sellerId;

    // This is a complex query to ensure the seller owns the product they're trying to edit.
    // It joins 'products' and 'shops' tables.
    const product = await pool.query(
      'SELECT p.id FROM products p JOIN shops s ON p.shop_id = s.id WHERE p.id = $1 AND s.seller_id = $2',
      [productId, sellerId]
    );

    if (product.rows.length === 0) {
      return res.status(403).json({ msg: 'Authorization denied. You do not own this product.' });
    }

    // If they own it, update the product
    const updatedProduct = await pool.query(
      'UPDATE products SET is_available = $1, last_updated = NOW() WHERE id = $2 RETURNING *',
      [is_available, productId]
    );

    res.json(updatedProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// ROUTE: GET /api/products/shop/:shopId
// PURPOSE: To get all AVAILABLE products for a specific shop
// ACCESS: Public
router.get('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;

    // Find all products for this shop that are marked as 'is_available = true'
    const products = await pool.query(
      "SELECT id, name, last_updated FROM products WHERE shop_id = $1 AND is_available = true ORDER BY name",
      [shopId]
    );

    res.json(products.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ROUTE: DELETE /api/products/:productId
// PURPOSE: To delete a product
// ACCESS: Private (requires token)
router.delete('/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.sellerId;

    // Security Check: Does this seller own the product they're trying to delete?
    const product = await pool.query(
      'SELECT p.id FROM products p JOIN shops s ON p.shop_id = s.id WHERE p.id = $1 AND s.seller_id = $2',
      [productId, sellerId]
    );

    if (product.rows.length === 0) {
      return res.status(403).json({ msg: 'Authorization denied. You do not own this product.' });
    }

    // If they own it, delete the product
    await pool.query('DELETE FROM products WHERE id = $1', [productId]);

    res.json({ msg: 'Product deleted successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;