//Dealing with user management part of project
//Focus on the following operations: registerUser, editUser, deleteUser, and login


const http = require('http');
const url = require('url');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost', 
  user: 'root',
  password: 'i<3rutgers',
  database: 'PickupPlus'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to database: ' + err.stack);
    return;
  }
  //console.log('Connected with id: ' + db.threadId);
});

// creates and stores restuarant info in db
function registerUser(req, res) {
  let body = '';
  req.on('data', chunk => {
      body += chunk.toString();
  });

  req.on('end', async () => { 
      const {firstname,lastname, address, email, phonenumber, password} = JSON.parse(body);

      bcrypt.hash(password, 10, function(err, hashedPassword) {
          if (err) {
              res.writeHead(500, {'Content-Type': 'application/json'});
              res.end(JSON.stringify({ message: "Error hashing password" }));
              return;
          }

          const sql = 'INSERT INTO user (firstname, lastname, address, email, phonenumber, password) VALUES (?, ?, ?, ?, ?, ?)';

          db.query(sql, [firstname, lastname, address, email, phonenumber, hashedPassword], (error, results) => {
              if (error){
                  res.writeHead(500, {'Content-Type': 'application/json'});
                  res.end(JSON.stringify({ message: "Internal Server Error", error: error.message }));
                  return;
              }

              res.writeHead(201, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ userid: results.insertId, message: 'user registered successfully.' }));
          });
      });
  });
}
// login and retrieve user details using the userId
function userLogin(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', async () => {
        const { email, password } = JSON.parse(body);

        const sql = 'SELECT * FROM user WHERE email = ?';
        db.query(sql, [email], (error, results) => {
            if (error || results.length === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "User not found" }));
                return;
            }
            const user = results[0];
            bcrypt.compare(password, user.password, function(err, result) {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: "Error comparing passwords" }));
                    return;
                }
                if (!result) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: "Invalid password" }));
                    return;
                }
                // Exclude password from user details
                delete user.password;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(user));
            });
        });
    });
}


// field should contain the name of a row in the db, i.e. 'name' 'address' 'email', etc.
function editUser(req, res, userid){
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    })

    req.on('end', () => {
      const updateFields = JSON.parse(body);
  
      const sql = `UPDATE user SET ? WHERE userid = ?`;
  
      db.query(sql, [updateFields, userid], (error, results) => {
        if (error || results.affectedRows === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: "user not found or update failed" }));
          return;
        }
  
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "user updated successfully" }));
      });
    });
}

function getuserId(req, res) {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const { name } = JSON.parse(body);

        const sql = 'SELECT userid FROM user WHERE name = ?';

        db.query(sql, [name], (error, results) => {
            if (error || results.length === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "User not found" }));
                return;
            }

            // Assuming the name is unique, return the user\ ID
            const userId = results[0].userid;

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ userId }));
        });
    });
}



function deleteUser(req, res, userid){
    const sql = 'DELETE FROM user WHERE userid = ?';

    db.query(sql, [userid], (error, results) => {
        if (error || results.affectedRows === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "user not found or already removed" }));
        return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "user removed successfully" }));
    });
}

module.exports = { registerUser, userLogin, editUser, deleteUser, getuserId};