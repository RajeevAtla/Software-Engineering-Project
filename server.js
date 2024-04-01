const http = require('http');
const url = require('url');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Assuming orderFunctions.js and a hypothetical menuFunctions.js are in the same directory
const {placeNewOrder, checkStatus, updateStatus, cancelOrder} = require('./orderFunctions');
const {openMenu} = require('./menuFunctions')
const {registerRestaurant, restaurantLogin, editRestaurant, deleteRestaurant} = require('./restaurantManagement');
const {registerUser, userLogin, editUser, deleteUser} = require('./userManagement');

const hostname = '127.0.0.1';
const port = 4002; // Unified server port

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true); // Parse the URL of the request
    const pathname = parsedUrl.pathname; // Get the pathname
    const method = req.method; // Get the HTTP method
    const query = parsedUrl.query; // Extract the query string as an object

    res.setHeader('Content-Type', 'application/json'); // JSON response for all endpoints

    // Handling for /api/orders route from the first server
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
    else if (pathname === '/api/restaurants' && method === 'POST') {
        // Register a new restaurant
        await registerRestaurant(req, res);
    } 
    else if (pathname.match(/\/api\/restaurants\/\d+$/) && method === 'GET') {
        // Login a restaurant (though typically, GET isn't used for login due to security concerns)
        const restaurantId = pathname.split('/')[3];
        await restaurantLogin(req, res, restaurantId);
    } 
    else if (pathname.match(/\/api\/restaurants\/\d+$/) && method === 'PUT') {
        // Edit restaurant details
        const restaurantId = pathname.split('/')[3];
        await editRestaurant(req, res, restaurantId);
    } 
    else if (pathname.match(/\/api\/restaurants\/\d+$/) && method === 'DELETE') {
        // Delete a restaurant
        const restaurantId = pathname.split('/')[3];
        await deleteRestaurant(req, res, restaurantId);
    }
    // Handling for /menu route from the second server
    else if (pathname === '/menu' && method === 'GET') {
        // Extract restaurantID from query parameters
        const restaurantID = query.restaurantID;
        if (restaurantID) {
            try {
                const menu = await openMenu(restaurantID);
                res.statusCode = 200;
                res.end(JSON.stringify(menu));
            } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: error.message }));
            }
        } else {
            res.statusCode = 400; // Bad Request for missing restaurantID
            res.end(JSON.stringify({ error: "Missing restaurantID parameter" }));
        }
    }
    // User registration
    else if (pathname === '/api/users/register' && method === 'POST') {
        registerUser(req, res);
    } 
    // User login, example route: /api/users/login/1 for user with userid 1
    else if (pathname === '/api/users/login' && method === 'POST') {
        userLogin(req, res);
    }
    // Edit user, example route: /api/users/edit/1 for user with userid 1
    else if (pathname.match(/\/api\/users\/edit\/\d+$/) && method === 'PUT') {
        const userid = pathname.split('/')[4]; // Extract userid from URL
        editUser(req, res, userid);
    } 
    // Delete user, example route: /api/users/delete/1 for user with userid 1
    else if (pathname.match(/\/api\/users\/delete\/\d+$/) && method === 'DELETE') {
        const userid = pathname.split('/')[4]; // Extract userid from URL
        deleteUser(req, res, userid);
    }
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found or Method Not Supported' }));
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
