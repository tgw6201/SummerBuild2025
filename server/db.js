const Pool = require('pg').Pool;
const pool = new Pool({
  user: "postgres",
  host: 'localhost',
  database: 'your_database',
  password: "2001",
  port: 5432,
});
