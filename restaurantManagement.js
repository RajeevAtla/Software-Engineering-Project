const bcrypt = require('bcrypt');

async function registerRestaurant(pool, req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    const { name, address, email, phonenumber, category, password } = JSON.parse(body);
    const hashedPassword = await bcrypt.hash(password, 10);

    let db;
    try {
      db = await pool.getConnection(); // Get a connection from the pool
      const [result] = await db.execute(
        'INSERT INTO Restaurant (name, address, email, phonenumber, category, password) VALUES (?, ?, ?, ?, ?, ?)',
        [name, address, email, phonenumber, category, hashedPassword]
      );

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ restaurantId: result.insertId, message: 'Restaurant registered successfully.' }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "Internal Server Error", error: error.message }));
    } finally {
      db.release(); // Release the connection back to the pool
    }
  });
}

async function restaurantLogin(pool, req, res, restaurantId) {
  let db;
  try {
    db = await pool.getConnection(); // Get a connection from the pool
    const [results] = await db.execute(
      'SELECT * FROM Restaurant WHERE restaurantId = ?',
      [restaurantId]
    );

    if (results.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "Restaurant not found" }));
      return;
    }

    const restaurantDetails = results[0];
    const password = req.headers['x-password'];

    const match = await bcrypt.compare(password, restaurantDetails.password);
    if (!match) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "Invalid password" }));
      return;
    }
    
    delete restaurantDetails.password;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(restaurantDetails));
  } catch (error) {
    console.error('Error processing request:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Internal server error" }));
  } finally {
      db.release(); // Release the connection back to the pool
  }
}

async function editRestaurant(pool, req, res, restaurantId) {
  let db;
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    const updateFields = JSON.parse(body);
    db = await pool.getConnection(); // Get a connection from the pool

    const setClause = Object.keys(updateFields).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateFields);

    try {
      const sql = `UPDATE Restaurant SET ${setClause} WHERE restaurantId = ?`;
      const [results] = await db.execute(sql, [...values, restaurantId]);

      if (results.affectedRows === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "Restaurant not found or update failed" }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "Restaurant updated successfully" }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "Internal Server Error", error: error.message }));
    } finally {
      db.release(); // Release the connection back to the pool
    }
  });
}

async function deleteRestaurant(pool, req, res, restaurantId) {
  let db;
  try {
    db = await pool.getConnection(); // Get a connection from the pool

    const [results] = await db.execute(
      'DELETE FROM Restaurant WHERE restaurantId = ?',
      [restaurantId]
    );

    if (results.affectedRows === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "Restaurant not found or already removed" }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Restaurant removed successfully" }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Internal Server Error", error: error.message }));
  } finally {
    db.release(); // Release the connection back to the pool
  }
}

async function getAllRestaurants(pool, req, res) {
  let db;
  try {
    db = await pool.getConnection(); // Get a connection from the pool
    const [results] = await db.query('SELECT name FROM Restaurant'); // Execute the query to get all restaurants

    if (results.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "No restaurants found" }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(results)); // Send the results as JSON
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Internal server error", error: error.message }));
  } finally {
    if (db) {
      db.release(); // Release the connection back to the pool
    }
  }
}


module.exports = { registerRestaurant, restaurantLogin, editRestaurant, deleteRestaurant, getAllRestaurants };
