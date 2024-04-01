const mysql = require('mysql2/promise');
const http = require('http');
const url = require('url');

const {placeNewOrder, printOrderDetails, createAndPrintOrder, checkStatus, updateStatus, cancelOrder} = require('./orderFunctions');

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