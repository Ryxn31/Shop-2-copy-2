require("dotenv").config();
const mysql = require("mysql2");

// Create a connection pool with promise support
const pool = mysql.createPool({
  host: process.env.DB_HOST,       // e.g., 'localhost'
  user: process.env.DB_USER,       // e.g., 'root'
  password: process.env.DB_PASSWORD, // Your MySQL password
  database: process.env.DB_NAME,   // e.g., 'day_to_day_shop'
  waitForConnections: true,
  connectionLimit: 10, // Number of simultaneous connections
  queueLimit: 0        // No limit on the number of requests in the queue
});

// Export the promise-based pool
module.exports = pool.promise();
