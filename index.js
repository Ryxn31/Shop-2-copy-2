const express = require('express');
const app = express();
const port = 3000;
const db = require('./config/db'); 
const bcrypt = require('bcrypt');
const saltRounds = 10;
const session = require('express-session');

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Set the view engine to EJS
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: 'your_secret_key', // Use a strong secret in production
  resave: false,
  saveUninitialized: true
}));

// Middleware for error handling
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
}

// Route for the home page
app.get('/', (req, res) => {
    const sql = 'SELECT * FROM products';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.render('index', { products: results });
    });
});

// Route for the products page
app.get('/products', (req, res) => {
    const sql = 'SELECT * FROM products';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.render('products', { products: results });
    });
});

// Route to get a specific product by ID
app.get('/products/:id', (req, res) => {
    const sql = 'SELECT * FROM products WHERE id = ?';
    db.query(sql, [req.params.id], (err, results) => {
        if (err) {
            console.error('Error fetching product:', err);
            return res.status(500).send('Internal Server Error');
        } else if (results.length === 0) {
            return res.status(404).send('Product not found');
        }
        res.render('productDetail', { product: results[0] });
    });
});

// Cart routes
app.get('/cart', (req, res) => {
    if (!Array.isArray(req.session.cart)) {
        req.session.cart = []; // Initialize cart if it doesn't exist
    }

    const total = req.session.cart.reduce((acc, item) => {
        return acc + (item.product.price * item.quantity);
    }, 0);

    res.render('cart', { cartItems: req.session.cart, total: total });
});

// Route to add an item to the cart
app.post('/cart/add', (req, res) => {
    const productId = req.body.productId;

    // Validate productId
    if (!productId || isNaN(productId)) {
        return res.status(400).json({ error: 'Invalid or missing Product ID' });
    }

    // Query database to get product details
    db.query('SELECT * FROM products WHERE id = ?', [productId], (error, results) => {
        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Server error while fetching product' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = results[0];

        // Initialize cart if it doesn't exist
        if (!req.session.cart) {
            req.session.cart = [];
        }

        // Check if the product is already in the cart
        const existingProductIndex = req.session.cart.findIndex(item => item.product.id === product.id);
        if (existingProductIndex > -1) {
            // Increment quantity if it exists
            req.session.cart[existingProductIndex].quantity += 1;
        } else {
            // Add new product to cart
            req.session.cart.push({
                product: {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image
                },
                quantity: 1
            });
        }

        res.status(200).json({ message: 'Product added to cart', cart: req.session.cart });
    });
});

// DELETE route to remove an item from the cart
app.delete('/cart/:id', (req, res) => {
    const productId = req.params.id;
    if (!req.session.cart) {
        return res.status(404).send('Cart is empty');
    }
    req.session.cart = req.session.cart.filter(item => item.product.id != productId);
    res.status(200).send({ success: true });
});

// PATCH route to update the quantity of an item in the cart
app.patch('/cart/:id', (req, res) => {
    const productId = req.params.id;
    const newQuantity = parseInt(req.body.quantity, 10);

    if (!req.session.cart) {
        return res.status(404).send('Cart is empty');
    }

    const item = req.session.cart.find(item => item.product.id == productId);
    if (item) {
        item.quantity = newQuantity;
        res.status(200).send({ success: true });
    } else {
        res.status(404).send({ error: 'Item not found' });
    }
});

// User registration route
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ error: 'Error hashing password' });
        }

        db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash], (error, results) => {
            if (error) {
                console.error('Error inserting user into database:', error);
                if (error.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Username or email already exists' });
                }
                return res.status(500).json({ error: 'Error registering user' });
            }

            res.status(201).json({ message: 'User  registered successfully' });
        });
    });
});

// Error handling middleware
app.use(errorHandler);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});