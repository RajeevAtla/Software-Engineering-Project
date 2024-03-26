const http = require('http');
const url = require('url');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

let db;
async function getDbConnection() {
  db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'your_password',
    database: 'PickupPlus'
  });
  return db;
}

async function registerRestaurant(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    const { name, address, email, phonenumber, category, password } = JSON.parse(body);
    const hashedPassword = await bcrypt.hash(password, 10);
    const db = await getDbConnection();

    try {
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
      await db.end();
    }
  });
}

async function restaurantLogin(req, res, restaurantId) {
  const db = await getDbConnection();
  try {
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
    await db.end();
  }
}

async function editRestaurant(req, res, restaurantId) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    const updateFields = JSON.parse(body);
    const db = await getDbConnection();

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
      await db.end();
    }
  });
}


async function deleteRestaurant(req, res, restaurantId) {
  const db = await getDbConnection();

  try {
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
    await db.end();
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  const matchRestaurantId = path.match(/^\/api\/restaurants\/(\d+)$/);
  const restaurantId = matchRestaurantId ? matchRestaurantId[1] : null;

  if (path === "/api/restaurants" && method === "POST") {
    registerRestaurant(req, res);
  } else if (restaurantId && method === "GET") {
    restaurantLogin(req, res, restaurantId);
  } else if (restaurantId && method === "PUT") {
    editRestaurant(req, res, restaurantId);
  } else if (restaurantId && method === "DELETE") {
    deleteRestaurant(req, res, restaurantId);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Not Found" }));
  }
});

const PORT = 302;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function closeConnections(){
  db.end();
  server.close();
}

module.exports = { server, closeConnections };
