//Dealing with user management part of project
//Focus on the following operations: registerUser, editUser, deleteUser, and login

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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

    // const { firstname, lastname, address, email, phonenumber, password } = JSON.parse(body);
    // const hashedPassword = await bcrypt.hash(password, 10);
    //
    // db = await pool.getConnection();
    // const [results] = await db.execute(
    //   'INSERT INTO user (firstname, lastname, address, email, phonenumber, password) VALUES (?, ?, ?, ?, ?, ?)',
    //   [firstname, lastname, address, email, phonenumber, hashedPassword]
    // );
    results = RegisterUserToDb(db, JSON.parse(body));

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ userid: results.insertId, message: 'user registered successfully.' }));

  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Internal Server Error", error: error.message }));
  } finally {
    if (db) db.release(); // Release the connection if it was acquired
  }
}

async function RegisterUserToDb(db, { firstname, lastname, address, email, phonenumber, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);

    db = await pool.getConnection();
    const [results] = await db.execute(
      'INSERT INTO user (firstname, lastname, address, email, phonenumber, password) VALUES (?, ?, ?, ?, ?, ?)',
      [firstname, lastname, address, email, phonenumber, hashedPassword]
    );
  return results;
};

async function userLogin(pool, req, res) {
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

    const { email, password } = JSON.parse(body);

    db = await pool.getConnection();
    const [results] = await db.execute('SELECT * FROM user WHERE email = ?', [email]);

    if (results.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "User not found" }));
      return;
    }

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "Invalid password" }));
      return;
    }

    // Exclude password from user details and generate token
    delete user.password;
    const accessToken = jwt.sign({ userId: user.userid }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ user, accessToken }));

  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Internal Server Error", error: error.message }));
  } finally {
    if (db) db.release();
  }
}

// field should contain the name of a row in the db, i.e. 'name' 'address' 'email', etc.
async function editUser(pool, req, res, userid) {
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

    const updateFields = JSON.parse(body);

    db = await pool.getConnection();
    const [result] = await db.execute(
      'UPDATE user SET ? WHERE userid = ?',
      [updateFields, userid]
    );

    if (result.affectedRows === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "user not found or update failed" }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "user updated successfully" }));

  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Internal Server Error", error: error.message }));
  } finally {
    if (db) db.release(); // Release the connection if it was acquired
  }
}

async function getuserId(pool, req, res) {
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

    const { name } = JSON.parse(body);

    db = await pool.getConnection();
    const [results] = await db.execute('SELECT userid FROM user WHERE name = ?', [name]);

    if (results.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "User not found" }));
      return;
    }

    const userId = results[0].userid;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ userId }));

  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Internal Server Error", error: error.message }));
  } finally {
    if (db) db.release(); // Release the connection if it was acquired
  }
}

async function deleteUser(pool, req, res, userid) {
  let db;
  try {
    db = await pool.getConnection();
    const [result] = await db.execute('DELETE FROM user WHERE userid = ?', [userid]);

    if (result.affectedRows === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "user not found or already removed" }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "user removed successfully" }));

  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Internal Server Error", error: error.message }));
  } finally {
    if (db) db.release(); // Release the connection if it was acquired
  }
}

function verifyToken(token) {
  try {
      if (!token) {
          throw new Error('No token provided');
      }
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      return { userId: decoded.userId, error: null };
  } catch (error) {
      return { userId: null, error: error.message };
  }
}

module.exports = { registerUser, userLogin, editUser, deleteUser, getuserId, verifyToken, RegisterUserToDb };


//export ACCESS_TOKEN_SECRET='your_secret_key_here'
