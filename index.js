// index.js
const express = require("express");
const app = express();
const port = 3000;
const db = require("./config/db");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const session = require("express-session");
const adminRoutes = require('./Routes/admin'); // Ensure './Routes/admin' is correct
const cartRoutes = require('./Routes/cart');

// Session middleware
app.use(session({
    secret: "your_secret_key", // Use a strong secret in production
    resave: false,
    saveUninitialized: true,
}));

// Serve static files from the 'public' directory
app.use(express.static("public"));

// Set the view engine to EJS
app.set("view engine", "ejs");

console.log(app.get('views'));

app.use('/cart', cartRoutes);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Middleware for error handling
function errorHandler(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send("Something broke!");
}

// Route for the home page
app.get("/", async (req, res) => {
    try {
        const [products] = await db.query("SELECT * FROM products");
        res.render("index", { products });
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Route for the products page
app.get("/products", async (req, res) => {
    try {
        const [products] = await db.query("SELECT * FROM products");
        res.render("products", { products });
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Route to get a specific product by ID
app.get("/products/:id", async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
        if (results.length === 0) {
            return res.status(404).send("Product not found");
        }
        res.render("productDetail", { product: results[0] });
    } catch (err) {
        console.error("Error fetching product:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Cart routes
app.get("/cart", (req, res) => {
    if (!Array.isArray(req.session.cart)) {
        req.session.cart = []; // Initialize cart if it doesn't exist
    }

    const total = req.session.cart.reduce((acc, item) => {
        return acc + item.product.price * item.quantity;
    }, 0);

    res.render("cart", { cartItems: req.session.cart, total });
});

// Route to add an item to the cart
app.post("/cart/add", async (req, res) => {
    const productId = req.body.productId;

    if (!productId || isNaN(productId)) {
        return res.status(400).json({ error: "Invalid or missing Product ID" });
    }

    try {
        const [results] = await db.query("SELECT * FROM products WHERE id = ?", [productId]);

        if (results.length === 0) {
            return res.status(404).json({ error: "Product not found" });
        }

        const product = results[0];

        if (!req.session.cart) {
            req.session.cart = [];
        }

        const existingProductIndex = req.session.cart.findIndex(item => item.product.id === product.id);
        if (existingProductIndex > -1) {
            req.session.cart[existingProductIndex].quantity += 1;
        } else {
            req.session.cart.push({
                product: {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                },
                quantity: 1,
            });
        }

        res.status(200).json({ message: "Product added to cart", cart: req.session.cart });
    } catch (err) {
        console.error("Error adding product to cart:", err);
        res.status(500).json({ error: "Server error while adding product" });
    }
});

// DELETE route to remove an item from the cart
app.delete("/cart/:id", (req, res) => {
    const productId = req.params.id;

    if (!req.session.cart) {
        return res.status(404).send("Cart is empty");
    }

    req.session.cart = req.session.cart.filter(item => item.product.id != productId);
    res.status(200).send({ success: true });
});

// PATCH route to update the quantity of an item in the cart
app.patch("/cart/:id", (req, res) => {
    const productId = req.params.id;
    const newQuantity = parseInt(req.body.quantity, 10);

    if (!req.session.cart) {
        return res.status(404).send("Cart is empty");
    }

    const item = req.session.cart.find(item => item.product.id == productId);
    if (item) {
        item.quantity = newQuantity;
        res.status(200).send({ success: true });
    } else {
        res.status(404).send({ error: "Item not found" });
    }
});

// User registration route
app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await db.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username, email, hashedPassword]);

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error inserting user into database:", error);
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ error: "Username or email already exists" });
        }
        res.status(500).json({ error: "Error registering user" });
    }
});

// User login route
// User login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE LOWER(username) = ?', [username.toLowerCase()]);

        if (rows.length === 0) {
            return res.status(401).send('No account found with this username.');
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).send('Invalid credentials.');
        }

        // Save user in session
        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role, // e.g., 'admin' or 'customer'
        };

        // Redirect to appropriate dashboard or homepage
        if (user.role === 'admin') {
            return res.redirect('/admin/dashboard');
        }

        res.redirect('/');
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal Server Error');
    }
});

// My Orders Route
app.get('/cart/my-orders', async (req, res) => {
    // Ensure the user is logged in
    const userId = req.session.user?.id;
    if (!userId) {
        return res.status(401).send('You must be logged in to view your orders.');
    }

    try {
        // Fetch all orders for the logged-in user
        const [orders] = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);

        // Render the myOrders.ejs view and pass the orders
        res.render('myOrders', { orders });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).send('An error occurred. Please try again.');
    }
});

// Login and registration forms
app.get("/login", (req, res) => {
    if (req.session.user) {
        return res.redirect("/");
    }
    res.render("login");
});

app.get("/register", (req, res) => {
    if (req.session.user) {
        return res.redirect("/");
    }
    res.render("register");
});

// Error handling middleware
app.use(errorHandler);


app.use('/admin', adminRoutes);


// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
