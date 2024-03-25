const mysql = require('mysql2/promise');
const http = require('http');
const url = require('url');

// Assuming you have established a database connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'i<3rutgers',
  database: 'PickupPlus'
};

// Function to place a new order
async function placeNewOrder(cartId, userId) {
    let connection;
    let orderResult; // Declare orderResult outside the try block to widen its scope
  
    try {
      connection = await mysql.createConnection(dbConfig);
      await connection.beginTransaction();
      
      // checks if the user id inputted exists
      const [user] = await connection.query('SELECT userid FROM User WHERE userid = ?', [userId]);
        if (user.length === 0) {
            return 'no user'; 
        }


      // checks if the cart id inputted exists
      const [cart] = await connection.query('SELECT cartid FROM Cart WHERE cartid = ?', [cartId]);
      if (cart.length === 0) {
          return 'no cart'; 
      }

      // Calculate the total price for the order
      const [cartItems] = await connection.query(
        'SELECT ci.quantity, mi.price FROM CartItems ci JOIN MenuItem mi ON ci.itemid = mi.itemid WHERE ci.cartid = ?',
        [cartId]
      );
  
      const totalPrice = cartItems.reduce((acc, currentItem) => {
        return acc + (currentItem.quantity * currentItem.price);
      }, 0);
  
      // Insert the new order into the Orders table
      orderResult = await connection.query( // use let or const declared outside try
        'INSERT INTO Orders (cartid, userid, ordertime, totalprice, orderstatus) VALUES (?, ?, NOW(), ?, ?)',
        [cartId, userId, totalPrice, 'Pending']
      );
  
      await connection.commit();
      console.log(`Order placed successfully with ID: ${orderResult[0].insertId}`);
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Failed to place order:', error);
      throw error; // Rethrow the error to handle it in the calling function
    } finally {
      if (connection) await connection.end();
    }
    
    return orderResult[0].insertId;
}
  
async function printOrderDetails(orderNumber) {
    const connection = await mysql.createConnection(dbConfig);
  
    try {
      // Fetch order details
      const [orderDetails] = await connection.query(
        'SELECT o.orderid, o.ordertime, o.totalprice, o.orderstatus, u.firstname, u.lastname, o.cartid FROM Orders o JOIN User u ON o.userid = u.userid WHERE o.orderid = ?',
        [orderNumber]
      );
  
      if (orderDetails.length === 0) {
        console.log(`No order found with ID: ${orderNumber}`);
        return
      }
  
      const order = orderDetails[0];
  
      // Fetch items for the order using the cartid from the order details
      const [items] = await connection.query(
        'SELECT mi.name, mi.description, mi.price, ci.quantity FROM CartItems ci JOIN MenuItem mi ON ci.itemid = mi.itemid WHERE ci.cartid = ?',
        [order.cartid]
      );
  
      // Print order details
      console.log(`Order ID: ${order.orderid}`);
      console.log(`Order Time: ${order.ordertime}`);
      console.log(`Customer Name: ${order.firstname} ${order.lastname}`);
      console.log(`Total Price: $${parseFloat(order.totalprice).toFixed(2)}`);
      console.log(`Order Status: ${order.orderstatus}`);
      console.log('Items:');
      items.forEach(item => {
        console.log(`- ${item.name}: ${item.quantity} x $${parseFloat(item.price).toFixed(2)} (Description: ${item.description})`);
      });
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      // Always close the connection
      await connection.end();
    }
}
  
async function createAndPrintOrder(cartId, userId) {
  try {
    const orderId = await placeNewOrder(cartId, userId); // This waits for the order ID
    console.log('Order placement process completed.');
    await printOrderDetails(orderId); // Now prints details for the new order
  } catch (error) {
    // If placeNewOrder throws an error, it will be caught here
    console.error('An error occurred:', error);
  }
}


async function checkStatus(orderNumber) { // fetches the order status of a specific order
  let connection;
  try {
      connection = await mysql.createConnection(dbConfig);
      // Fetches from the database the order status from an order with the order id requested
      const [order] = await connection.query('SELECT orderstatus FROM Orders WHERE orderid = ?', [orderNumber]);

      // Order with orderid not found
      if (order.length === 0) {
          console.log(`No order found with ID: ${orderNumber}`);
          return "Order not found"; // Return a message indicating no order was found
      }

      let orderStatus = order[0].orderstatus;
      console.log(`Order ID: ${orderNumber} \nStatus: ${orderStatus}`);
      return orderStatus; // Return the order status to the caller
  } catch (error) { // If there is an error
      console.error('Error fetching order details:', error);
      return "Error fetching order details"; // Return a message indicating an error occurred
  } finally {
      if (connection) {
          await connection.end(); // Always close the connection
      }
  }
}


async function updateStatus(orderNumber) { // updates the order with status 
    const connection = await mysql.createConnection(dbConfig);
    try {
        // Fetches the current status of the order from the database
        const [orders] = await connection.query('SELECT orderstatus FROM Orders WHERE orderid = ?', [orderNumber]);

        // Checks if the order with the specified orderid was found
        if (orders.length === 0) {
            console.log(`No order found with ID: ${orderNumber}`);
            return null;
        }

        let currentStatus = orders[0].orderstatus;

        // order progression
        const statusProgression = ['Pending', 'In Progress', 'Ready', 'Completed'];
        const currentIndex = statusProgression.indexOf(currentStatus);

        // If the current status is found and not the last element in the progression array
        if (currentIndex !== -1 && currentIndex < statusProgression.length - 1) {
            const nextStatus = statusProgression[currentIndex + 1];
            await connection.query('UPDATE Orders SET orderstatus = ? WHERE orderid = ?', [nextStatus, orderNumber]);
            console.log(`Order ID: ${orderNumber} status updated from ${currentStatus} to ${nextStatus}.`);
            return 'updated'; 
        } 
        else if (currentIndex == statusProgression.length - 1)
        {
            console.log(`Order ID: ${orderNumber} is already completed`);
            return 'completed'; 
        }
    } catch (error) {
        console.error('Error updating order status:', error);
    } finally {
        // Always close the connection
        await connection.end();
    }
}



//cancel order, the status is preparing or completed, throw back and error 
async function cancelOrder(orderNumber){
  const connection = await mysql.createConnection(dbConfig);
    try{
        // fetches from the database the order status from an order with the order id request
        const [order] = await connection.query('SELECT orderstatus FROM Orders WHERE orderid = ?', [orderNumber]);

        // order with orderid not found
        if (order.length === 0) {
            console.log(`No order found with ID: ${orderNumber}`);
            return null;
          }

        let orderStatus = order[0].orderstatus;

        if (orderStatus != 'Pending'){ // order cannot be canceled when it is not pending
          console.log('Order with order ID ' + orderNumber + ' cannot be canceled as it is out of the Pending status stage')
          return 'invalid';
        }
        else{
          await connection.execute('DELETE FROM Orders WHERE orderid = ?', [orderNumber]);
          console.log('Order with order ID ' + orderNumber + ' canceled')
          return 'canceled';
        }
    }
    catch (error) { // if there is an error
    console.error('Error fetching order details:', error);
    } 
    finally {
    // Always close the connection
    await connection.end();
    }

}

const hostname = '127.0.0.1';
const port = 4002;

const server = http.createServer(async (req, res) => {
    const reqUrl = url.parse(req.url, true);
    const pathname = reqUrl.pathname;
    const method = req.method;

    // Route for creating an order - POST /api/orders
    if (pathname === '/api/orders' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // Convert Buffer to string
        });
        req.on('end', async () => {
            try {
                const { cartId, userId } = JSON.parse(body);
                const result = await placeNewOrder(cartId, userId);

                if (result == 'no cart')
                {
                  res.writeHead(404, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ message: 'Cart id not found' }));
                }
                else if (result == 'no user'){
                  res.writeHead(404, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ message: 'User id not found' }));
                }
                else {
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ orderId: result, message: 'Order created successfully' }));
                }
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to create order' }));
            }
        });
    }
    // Route for checking an order's status - GET /api/orders/{orderID}
    else if (pathname.startsWith('/api/orders/') && method === 'GET') {
      const orderNumber = pathname.split('/')[3];
      if (orderNumber) {
          try {
              const status = await checkStatus(orderNumber); // Await the status from checkStatus function
              if (status === "Order not found" || status === "Error fetching order details") {
                  res.writeHead(404, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: status }));
              } else {
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ status: status })); // Use the status in the response
              }
          } catch (error) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Internal server error' }));
          }
      }
  }
    // Route for updating an order's status - PUT /api/orders/notifications/{orderID}
    else if (pathname.startsWith('/api/orders/notifications/') && method === 'PUT') {
        const orderNumber = pathname.split('/')[4];
        if (orderNumber) {
            try {
                let result = await updateStatus(orderNumber);
                if (result == null) {
                  // Order not found
                  res.writeHead(404, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Order not found' }));
                } 
                else if (result == 'completed'){
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ message: 'Order is already completed' }));
                }
                else {
                  // Order status updated successfully
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ message: 'Order status updated successfully' }));
              }
  
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to update order status' }));
            }
        }
    }
    // Route for cancelling an order - DELETE /api/orders/{orderID}
    else if (pathname.startsWith('/api/orders/') && method === 'DELETE') {
        const orderNumber = pathname.split('/')[3];
        if (orderNumber) {
            try {
                result = await cancelOrder(orderNumber);
                if (result == null){
                  res.writeHead(404, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Order not found' }));
                }
                else if (result == 'invalid'){
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Order needs to have Pending status to be canceled' }));
                }
                else{
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ message: 'Order cancelled successfully' }));
                }
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to cancel order' }));
            }
        }
    }
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

if (require.main === module) {
  server.listen(port, hostname, () => {
      console.log(`Server running at http://${hostname}:${port}/`);
  });
}

module.exports = server;