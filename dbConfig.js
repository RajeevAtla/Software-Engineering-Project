const readline = require('readline');
const mysql = require('mysql2/promise');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function configureDatabase() {
  return new Promise((resolve, reject) => {
    rl.question('Enter "1" for development or "2" for production: ', (answer) => {
      let pool;
      if (answer === '1') {
        pool = mysql.createPool({
          host: 'localhost',
          user: 'root',
          password: 'i<3rutgers',
          database: 'PickupPlus',
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        });
      } else if (answer === '2') {
        pool = mysql.createPool({
          host: process.env.AWS_HOST,
          user: process.env.AWS_USERNAME,
          password: process.env.AWS_PASSWORD,
          database: 'initial_db',
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        });
      } else {
        reject(new Error('Invalid selection'));
        rl.close();
        return;
      }
      resolve(pool);
      rl.close();
    });
  });
}

module.exports = configureDatabase;
