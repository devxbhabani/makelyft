const { Pool } = require("pg");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

// Postgres connection string should be in your .env file as DB_URI
const pool = new Pool({
    connectionString: process.env.DB_URI
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
    pool: pool
};
