// This file sets up a connection to a PostgreSQL database using the pg library.
// Make sure to install the pg library using npm install pg
// Make sure to replace with env file later on (## REMINDER ##)

const Pool = require('pg').Pool;
const pool = new Pool({
  user: "postgres",
  host: 'localhost',
  database: 'summerbuild',
  password: "1234",  // Either 1111 or 1234 (Depending on PC)
  port: 5432
});

module.exports = pool;