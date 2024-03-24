//We are dealing with the order processing part of the application
//Order creation is being handled by group 2's cart processes, so I believe it is out of scope for us for now
//Our demo should focus on our 4 operations: checkOrderStatus, updateOrder, cancelOrder, and getNotifications
//We also need to worry about validation through 3rd party payment serives, (we may have to spoof this for now?)


const http = require('http');
const url = require('url');
const mysql = require('mysql');

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'your_database_name'
});

db.connect(err => {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('connected as id ' + db.threadId);
});

function createOrder(req, res) {
  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    const { userId, restaurantId, orderItems } = JSON.parse(body);

    const sql = 'INSERT INTO orders (userId, restaurantId, orderItems, status) VALUES (?, ?, ?, "pending")';

    db.query(sql, [userId, restaurantId, JSON.stringify(orderItems)], (error, results) => {
      if (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "Internal Server Error", error: error.message }));
        return;
      }

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ orderId: results.insertId }));
    });
  });
}

function checkOrderStatus(req, res, orderId) {
  const sql = 'SELECT status FROM orders WHERE orderId = ?';

  db.query(sql, [orderId], (error, results) => {
    if (error || results.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "Order not found" }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: results[0].status }));
  });
}

function updateOrder(req, res, orderId) {
  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    const { orderStatus } = JSON.parse(body);

    const sql = 'UPDATE orders SET status = ? WHERE orderId = ?';

    db.query(sql, [orderStatus, orderId], (error, results) => {
      if (error || results.affectedRows === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "Order not found or update failed" }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "Order updated successfully" }));
    });
  });
}

function cancelOrder(req, res, orderId) {
  const sql = 'UPDATE orders SET status = "canceled" WHERE orderId = ?';

  db.query(sql, [orderId], (error, results) => {
    if (error || results.affectedRows === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "Order not found or already canceled" }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Order canceled successfully" }));
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Extract orderId for routes that include it
  const matchOrderId = path.match(/^\/api\/orders\/([0-9a-zA-Z]+)(\/notifications)?$/);
  const orderId = matchOrderId ? matchOrderId[1] : null;

  // Routing
  if (path === "/api/orders" && method === "POST") {
    // Create Order
    createOrder(req, res);
  } 
  else if (path === `/api/orders/${orderId}` && method === "GET") {
    // Order Status Check
    checkOrderStatus(req, res, orderId);
  } 
  else if (path === `/api/orders/notifications/${orderId}` && method === "PUT") {
    // Order Update
    updateOrder(req, res, orderId);
  } 
  else if (path === `/api/orders/${orderId}` && method === "DELETE") {
    // Cancel Order
    cancelOrder(req, res, orderId);
  } 
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Not Found" }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
