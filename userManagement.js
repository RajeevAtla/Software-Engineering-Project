//Dealing with user management part of project
//Focus on the following operations: registerUser, editUser, deleteUser, and login

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// creates and stores restuarant info in db


async function registerUser(pool, req, res) {
  let db;
  try {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    await new Promise((resolve, reject) => {
      req.on('end', resolve);
      req.on('error', reject);
    });

    const { firstname, lastname, address, email, phonenumber, password } = JSON.parse(body);
    const hashedPassword = await bcrypt.hash(password, 10);

    db = await pool.getConnection();
    const [results] = await db.execute(
      'INSERT INTO user (firstname, lastname, address, email, phonenumber, password) VALUES (?, ?, ?, ?, ?, ?)',
      [firstname, lastname, address, email, phonenumber, hashedPassword]
    );

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ userid: results.insertId, message: 'user registered successfully.' }));

  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Internal Server Error", error: error.message }));
  } finally {
    if (db) db.release(); // Release the connection if it was acquired
  }
}


// login and retrieve user details using the userId
async function userLogin(pool, req, res) {
  const db = await pool.getConnection(); // Get a connection from the pool
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
  db.release(); // Release the connection back to the pool
}


// field should contain the name of a row in the db, i.e. 'name' 'address' 'email', etc.
async function editUser(pool, req, res, userid) {
  const db = await pool.getConnection(); // Get a connection from the pool
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
  db.release(); // Release the connection back to the pool
}

async function getuserId(pool, req, res) {
  const db = await pool.getConnection(); // Get a connection from the pool
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
  db.release(); // Release the connection back to the pool
}

async function deleteUser(pool, req, res, userid) {
  const db = await pool.getConnection(); // Get a connection from the pool
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
  db.release(); // Release the connection back to the pool
}

module.exports = { registerUser, userLogin, editUser, deleteUser, getuserId };
