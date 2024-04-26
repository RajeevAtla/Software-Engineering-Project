
const readline = require('readline');
const mysql = require('mysql2/promise');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function configureDatabase() {
  return new Promise((resolve, reject) => {
    rl.question('Enter "1" for development or "2" for production: ', async (answer) => {
      let poolConfig;
      if (answer === '1') {
        poolConfig = {
          host: 'localhost',
          user: 'root',
          password: 'sweteam',
          database: 'PickupPlus',
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        };
      } else if (answer === '2') {
        poolConfig = {
          host: process.env.AWS_HOST,
          user: process.env.AWS_USERNAME,
          password: process.env.AWS_PASSWORD,
          database: 'initial_db',
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        };
      } else {
        rl.close();
        reject(new Error('Invalid selection'));
        return;
      }

      try {
        const pool = mysql.createPool(poolConfig);
        // Perform a test query to check the connection
        await pool.query('SELECT 1'); // This ensures that the pool is not only created but connected
        resolve(pool);
      } catch (error) {
        reject(error);
      } finally {
        rl.close();
      }
    });
  });
}

module.exports = configureDatabase;

