// Routes/cart.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Checkout Route
router.post('/checkout', async (req, res) => {
    const userId = req.session.user?.id; // Assume user is logged in
    const cart = req.session.cart; // Get cart from session

    if (!userId) {
        return res.status(401).send('You must be logged in to checkout.');
    }
    if (!cart || cart.length === 0) {
        return res.status(400).send('Your cart is empty.');
    }

    try {
        // Calculate total price
        const totalPrice = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);

        // Create an order in the database
        const [orderResult] = await db.query(
            'INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)',
            [userId, totalPrice, 'pending']
        );

        const orderId = orderResult.insertId;

        // Insert order items into the database
        for (const item of cart) {
            await db.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.product.id, item.quantity, item.product.price]
            );

            // Update product stock
            await db.query(
                'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
                [item.quantity, item.product.id, item.quantity]
            );
        }

        // Clear the cart after successful checkout
        req.session.cart = [];

        // Redirect to confirmation page with the order ID
        res.redirect(`/cart/confirmation/${orderId}`);
    } catch (error) {
        console.error('Error during checkout:', error);
        res.status(500).send('An error occurred during checkout.');
    }
});

router.get('/confirmation/:orderId', async (req, res) => {
    const { orderId } = req.params;

    try {
        // Fetch the order details
        const [orderResults] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        if (orderResults.length === 0) {
            return res.status(404).send('Order not found');
        }

        const order = orderResults[0];

        // Ensure total_price is a number
        order.total_price = parseFloat(order.total_price);

        res.render('confirmation', { order });
    } catch (error) {
        console.error('Error fetching order confirmation:', error);
        res.status(500).send('An error occurred. Please try again.');
    }
});


module.exports = router;
