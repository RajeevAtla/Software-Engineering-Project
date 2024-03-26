const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'try again next time.lol.aws.com',
  user: 'try again',
  password: 'you thought lol',
  database: 'totallyReal_db'
};
// Replace placeholders with your actual RDS information
// async function connectToDatabase() {
//   const connection = await mysql.createConnection();
//
//   // Test the Connection
//   connection.connect((error) => {
//     if (error) {
//       console.error('Error connecting to the database:', error);
//     } else {
//       console.log('Connected to the MySQL database!');
//     }
//   });
// }
async function testfunc() {
  let connection = await mysql.createConnection(dbConfig);
  await connection.beginTransaction();

  // connectToDatabase(); // Call the async function to establish the connection

  console.log(`      const [user] = await connection.query('SELECT firstname FROM User WHERE userid = ?', [1]);
        if (user.length === 0) {
            return 'no user'; 
        }
This is a real userid`);
  var [user] = await connection.query('SELECT firstname FROM User WHERE userid = ?', [1]);
  if (user.length === 0) {
    return 'no user';
  }


  console.log("Result = ", user)

  console.log(`      const [user] = await connection.query('SELECT firstname FROM User WHERE userid = ?', [2]);
        if (user.length === 0) {
            return 'no user'; 
        }
This is not a real userid`);
  var [user] = await connection.query('SELECT firstname FROM User WHERE userid = ?', [2]);
  if (user.length === 0) {
    return 'no user';
  }


  console.log("Result = ", user)
}

testfunc();
