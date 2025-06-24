// This file sets up a connection to a PostgreSQL database using the pg library.
// Make sure to install the pg library using npm install pg
// Make sure to replace with env file later on (## REMINDER ##)

const Pool = require('pg').Pool;
const pool = new Pool({
  user: "postgres",
  host: 'localhost',
  database: 'summerbuild',
  password: "1234", 
  port: 5432
});

module.exports = pool;