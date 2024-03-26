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
  password: 'your_password',
  database: 'your_db_name'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to database: ' + err.stack);
    return;
  }
  console.log('Connected with id: ' + db.threadId);
});

// creates and stores restuarant info in db
function registerUser(req, res) {
  let body = '';
  req.on('data', chunk => {
      body += chunk.toString();
  });

  req.on('end', async () => { 
      const {name, address, email, phonenumber, category, password} = JSON.parse(body);

      bcrypt.hash(password, 10, function(err, hashedPassword) {
          if (err) {
              res.writeHead(500, {'Content-Type': 'application/json'});
              res.end(JSON.stringify({ message: "Error hashing password" }));
              return;
          }

          const sql = 'INSERT INTO user (name, address, email, phonenumber, category, password) VALUES (?, ?, ?, ?, ?, ?)';

          db.query(sql, [name, address, email, phonenumber, category, hashedPassword], (error, results) => {
              if (error){
                  res.writeHead(500, {'Content-Type': 'application/json'});
                  res.end(JSON.stringify({ message: "Internal Server Error", error: error.message }));
                  return;
              }

              res.writeHead(201, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ userid: results.insertId }));
          });
      });
  });
}
// login and retrieve user details using the userId
function userLogin(req, res, userid) {
  const sql = 'SELECT * FROM user WHERE userid = ?';

  db.query(sql, [userid], (error, results) => {
      if (error || results.length === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: "user not found" }));
          return;
      }
      const userDetails = results[0];
      const { password } = JSON.parse(req.headers['x-password']); 

      bcrypt.compare(password, userDetails.password, function(err, result) {
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
          // Return user details excluding the password
          delete userDetails.password;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(userDetails));
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

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Extract userid for routes that include it
    const matchuserId = path.match(/^\/api\/users\/([0-9a-zA-Z]+)(\/.*)?$/);
    const userid = matchuserId ? matchuserId[1] : null;

  // Routing
  if (path === "/api/users" && method === "POST") {
    // Register user, request should include name, address, email, phonenumber, and category
    registerUser(req, res);
  } 
  else if (path === `/api/users/${userid}` && method === "GET") {
    // user Login
    userLogin(req, res, userid);
  } 
  else if (path === "/api/users" && method === "GET") {
    // Get user ID, requires name JSON object in request
    getuserId(req, res);
  } 
  else if (path === `/api/users/${userid}` && method === "PUT") {
    // Edit user
    editUser(req, res, userid);
  } 
  else if (path === `/api/users/${userid}` && method === "DELETE") {
    // Delete user
    deleteUser(req, res, userid);
  } 
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Not Found" }));
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

