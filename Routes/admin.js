const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Ensure correct DB connection
const isAdmin = require('../Middleware/isAdmin'); // Fixed path to middleware


// Admin Dashboard
router.get('/dashboard', isAdmin, async (req, res) => {
    try {
        const [productCount] = await db.query('SELECT COUNT(*) AS count FROM products');
        const [orderCount] = await db.query('SELECT COUNT(*) AS count FROM orders');
        const [userCount] = await db.query('SELECT COUNT(*) AS count FROM users');

        res.render('admin/dashboard', {
            productCount: productCount[0].count,
            orderCount: orderCount[0].count,
            userCount: userCount[0].count,
            username: req.session.user.username // Pass admin username
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);

        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(500).send('Database table is missing. Please contact the administrator.');
        }

        res.status(500).send('Internal Server Error');
    }
});


// Product Management
router.get('/products', isAdmin, async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products');
        console.log(products); // Log the products array
        res.render('admin/products', { products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/products', isAdmin, async (req, res) => {
    const { name, price, stock, description } = req.body;

    // Validate inputs
    if (!name || !price || isNaN(price) || !stock || isNaN(stock) || !description) {
        return res.status(400).send('Invalid input. Please provide all product details.');
    }

    try {
        // Insert new product into the database
        await db.query(
            'INSERT INTO products (name, price, stock, description) VALUES (?, ?, ?, ?)',
            [name, parseFloat(price), parseInt(stock), description]
        );

        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).send('Internal Server Error');
    }
});



// Order Management
router.get('/orders', isAdmin, async (req, res) => {
    try {
        const [orders] = await db.query('SELECT * FROM orders');
        res.render('admin/orders', { orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
