const http = require('http');
const url = require('url');
const mysql = require('mysql2/promise');

// Assuming orderFunctions.js and a hypothetical menuFunctions.js are in the same directory
const {placeNewOrder, checkStatus, updateStatus, cancelOrder} = require('./orderFunctions');
const {openMenu,addItem,deleteItem,searchItems,sortItemsByPrice,getItemsBelowPrice} = require('./menuFunctions')
const {registerRestaurant, restaurantLogin, editRestaurant, deleteRestaurant} = require('./restaurantManagement');
const {registerUser, userLogin, editUser, deleteUser} = require('./userManagement');
const {addItemToCart, deleteItemFromCart, getCartItems, clearCart} = require('./cartFunctions');

const hostname = '127.0.0.1';
const port = 4002; // Unified server port

//connect to mySQL
// Connection pool configuration
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'i<3rutgers',
    database: 'PickupPlus',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

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
        await registerRestaurant(pool, req, res);
    } 
    else if (pathname.match(/\/api\/restaurants\/\d+$/) && method === 'GET') {
        // Login a restaurant (though typically, GET isn't used for login due to security concerns)
        const restaurantId = pathname.split('/')[3];
        await restaurantLogin(pool, req, res, restaurantId);
    } 
    else if (pathname.match(/\/api\/restaurants\/\d+$/) && method === 'PUT') {
        // Edit restaurant details
        const restaurantId = pathname.split('/')[3];
        await editRestaurant(pool, req, res, restaurantId);
    } 
    else if (pathname.match(/\/api\/restaurants\/\d+$/) && method === 'DELETE') {
        // Delete a restaurant
        const restaurantId = pathname.split('/')[3];
        await deleteRestaurant(pool, req, res, restaurantId);
    }
    // Handling for /menu route from the second server
    else if (pathname === '/menu' && method === 'GET') {
        // Extract restaurantID from query parameters
        const restaurantID = query.restaurantID;
        if (restaurantID) {
            try {
                const menu = await openMenu(pool, restaurantID);
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
    else if (pathname === '/addItem' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // Convert Buffer to string
        });
        req.on('end', async () => {
            try {
                // Extract necessary data from the request body
                const { restaurantId, name, description, price } = JSON.parse(body);
                
                // Ensure all required fields are provided
                if (restaurantId && name && description && price) {
                    const result = await addItem(pool, restaurantId, name, description, price);
                    res.statusCode = 201; // Status code for created resource
                    res.end(JSON.stringify({ message: "Item added successfully", itemId: result.insertId }));
                } else {
                    // If any field is missing, return a Bad Request error
                    res.statusCode = 400; // Bad Request for missing fields
                    res.end(JSON.stringify({ error: "Missing one or more fields in request body" }));
                }
            } catch (error) {
                console.error(error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Error adding item" }));
            }
        });
    }
    else if (pathname === '/deleteItem' && method === 'DELETE') {
        // Extract itemID from query parameters
        const itemID = query.itemID;
        if (itemID) {
            try {
                const result = await deleteItem(pool, itemID);
                if (result.affectedRows === 0) {
                    res.statusCode = 404; // Not Found if no item was deleted
                    res.end(JSON.stringify({ error: "Item not found" }));
                } else {
                    res.statusCode = 200; // OK, item successfully deleted
                    res.end(JSON.stringify({ message: "Item successfully deleted" }));
                }
            } catch (error) {
                res.statusCode = 500; // Internal Server Error
                res.end(JSON.stringify({ error: error.message }));
            }
        } else {
            res.statusCode = 400; // Bad Request for missing itemID
            res.end(JSON.stringify({ error: "Missing itemID parameter" }));
        }
    }
    else if (pathname === '/searchItems' && method === 'GET') {
        // Extract itemID from query parameters
        const itemID = query.itemID;
        if (itemID) {
            try {
                const results = await searchItems(pool, itemID);
                if (results.length === 0) {
                    res.statusCode = 404; // Not Found if no items were found
                    res.end(JSON.stringify({ error: "Item not found" }));
                } else {
                    res.statusCode = 200; // OK, items found
                    res.end(JSON.stringify(results));
                }
            } catch (error) {
                res.statusCode = 500; // Internal Server Error
                res.end(JSON.stringify({ error: error.message }));
            }
        } else {
            res.statusCode = 400; // Bad Request for missing itemID
            res.end(JSON.stringify({ error: "Missing itemID parameter" }));
        }
    }
    else if (pathname === '/sortItemsByPrice' && method === 'GET') {
        try {
            const sortedItems = await sortItemsByPrice(pool);
            if (sortedItems.length === 0) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: "No items found" }));
            } else {
                res.statusCode = 200;
                res.end(JSON.stringify(sortedItems));
            }
        } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
        }
    }
    else if (pathname === '/getItemsBelowPrice' && method === 'GET') {
        const priceLimit = query.priceLimit;
        if (priceLimit) {
            try {
                const items = await getItemsBelowPrice(pool, priceLimit);
                if (items.length === 0) {
                    res.statusCode = 404; // Not Found if no items were found
                    res.end(JSON.stringify({ error: "No items found below the specified price" }));
                } else {
                    res.statusCode = 200; // OK, items found
                    res.end(JSON.stringify(items));
                }
            } catch (error) {
                res.statusCode = 500; // Internal Server Error
                res.end(JSON.stringify({ error: error.message }));
            }
        } else {
            res.statusCode = 400; // Bad Request for missing or invalid priceLimit
            res.end(JSON.stringify({ error: "Missing or invalid priceLimit parameter" }));
        }
    }

    // Cart Functions
    else if (pathname === '/cart/add' && method === 'POST') {
        const { cartId, itemId, quantity } = query;
        if (cartId && itemId && quantity) {
            try {
                const result = await addItemToCart(pool, cartId, itemId, quantity);
                res.statusCode = 200;
                res.end(JSON.stringify({ message: 'Item added to cart', result }));
            } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: error.message }));
            }
        } else {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing required parameters' }));
        }
    }
    else if (pathname === '/cart/delete' && method === 'POST') {
        const { cartId, itemId, quantity } = query;
        if (cartId && itemId) {
            try {
                const result = await deleteItemFromCart(pool, cartId, itemId, quantity);
                res.statusCode = 200;
                res.end(JSON.stringify({ message: 'Item deleted from cart', result }));
            } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: error.message }));
            }
        } else {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing required parameters' }));
        }
    }
    else if (pathname === '/cart/items' && method === 'GET') {
        const cartId = query.cartId;
        if (cartId) {
            try {
                const items = await getCartItems(pool, cartId);
                res.statusCode = items.length > 0 ? 200 : 404;
                res.end(JSON.stringify(items.length > 0 ? items : { error: "No items found in the cart" }));
            } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: error.message }));
            }
        } else {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing cartId parameter' }));
        }
    }
    else if (pathname === '/cart/clear' && method === 'POST') {
        const cartId = query.cartId;
        if (cartId) {
            try {
                const result = await clearCart(pool, cartId);
                res.statusCode = 200;
                res.end(JSON.stringify({ message: 'Cart cleared', result }));
            } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: error.message }));
            }
        } else {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing cartId parameter' }));
        }
    }
    // User registration
    else if (pathname === '/api/users/register' && method === 'POST') {
        await registerUser(pool, req, res);
    } 
    // User login, example route: /api/users/login/1 for user with userid 1
    else if (pathname === '/api/users/login' && method === 'POST') {
        await userLogin(pool, req, res);
    }
    // Edit user, example route: /api/users/edit/1 for user with userid 1
    else if (pathname.match(/\/api\/users\/edit\/\d+$/) && method === 'PUT') {
        const userid = pathname.split('/')[4]; // Extract userid from URL
        await editUser(pool, req, res, userid);
    } 
    // Delete user, example route: /api/users/delete/1 for user with userid 1
    else if (pathname.match(/\/api\/users\/delete\/\d+$/) && method === 'DELETE') {
        const userid = pathname.split('/')[4]; // Extract userid from URL
        await deleteUser(pool, req, res, userid);
    }
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found or Method Not Supported' }));
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
