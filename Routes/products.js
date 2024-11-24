const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Import the database connection

// GET route to fetch all products
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM products';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.render('products', { products: results });
        }
    });
});

module.exports = router;
