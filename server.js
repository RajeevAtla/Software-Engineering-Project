require('dotenv').config();
const http = require('http');
const url = require('url');
const mysql = require('mysql2/promise');
const multer = require('multer');
const pdf = require('pdf-parse');
const nodeMailer = require('nodemailer');



const {placeNewOrder, checkStatus, updateStatus, cancelOrder,} = require('./orderFunctions');
const {getCartItems,addItemToCart,deleteItemFromCart,clearCart} = require('./cartFunctions');
const { openMenu, addItem, deleteItem, searchItems, listItemCategories, sortItemsByPrice, getItemsBelowPrice, parseMenuItemsFromPDF } = require('./menuFunctions');
const { registerRestaurant, restaurantLogin, editRestaurant, deleteRestaurant, getAllRestaurants } = require('./restaurantManagement');
const {registerUser, userLogin, editUser, deleteUser, getuserId, verifyToken} = require('./userManagement');

const hostname = '127.0.0.1';
const port = 4002;

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
}).single('menuFile');

const configureDatabase = require('./dbConfig');

async function startServer() {
  let pool;
  try {
    pool = await configureDatabase();
    console.log('Database configured and pool created.');
  } catch (error) {
    console.error('Failed to configure the database:', error);
    return; // Stop the server from starting
  }

  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5500'); // Allows access specifically from your front-end
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Adjust if you use other methods
    res.setHeader('Access-Control-Allow-Headers', 'application/json'); // Adjust based on what headers your client sends
    res.setHeader('Content-Type', 'application/json'); // JSON response for all endpoints

    const parsedUrl = url.parse(req.url, true); // Parse the URL of the request
    const pathname = parsedUrl.pathname; // Get the pathname
    const method = req.method; // Get the HTTP method
    const query = parsedUrl.query; // Extract the query string as an object


    // Handling for /api/orders route from the first server
    if (pathname === '/api/orders' && method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString(); // Convert Buffer to string
      });
      req.on('end', async () => {
        try {
          // Extract the token from the Authorization header
          const authHeader = req.headers['authorization'];
          const token = authHeader && authHeader.split(' ')[1]; // Expected "Bearer TOKEN_VALUE"
          if (!token) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Auth token is not supplied' }));
            return;
          }
    
          let decoded;
          try {
            decoded = verifyToken(token);
          } catch (error) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Token is invalid' }));
            return;
          }
    
          const { cartId } = JSON.parse(body);
          const userId = decoded.userId; // Assuming your token stores the userId
    
          const result = await placeNewOrder(pool, cartId, userId,token);
    
          if (result == 'no cart') {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Cart id not found' }));
          } 
          else if (result == 'no user') {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'User id not found' }));
          } 
          else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ orderId: result, message: 'Order created successfully' }));
          }
        } 
        catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to create order', details: error.message }));
        }
      });
    }
    else if (pathname.startsWith('/api/orders/') && method === 'GET') {
      const orderNumber = pathname.split('/')[3];
      if (orderNumber) {
        try {
          const status = await checkStatus(pool, orderNumber); // Await the status from checkStatus function
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
          let result = await updateStatus(pool, orderNumber);
          if (result == null) {
            // Order not found
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Order not found' }));
          }
          else if (result == 'completed') {
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
          result = await cancelOrder(pool, orderNumber);
          if (result == null) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Order not found' }));
          }
          else if (result == 'invalid') {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Order needs to have Pending status to be canceled' }));
          }
          else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Order cancelled successfully' }));
          }
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to cancel order' }));
        }
      }
    }
    else if (pathname === '/api/restaurants/all' && method === 'GET') {
      // Get all restaurants
      await getAllRestaurants(pool, req, res);
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
          const menu = await openMenu(pool, restaurantID, res);
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
          const { restaurantID, name, description, price } = JSON.parse(body);

          // Ensure all required fields are provided
          if (restaurantID && name && description && price) {
            const result = await addItem(pool, restaurantID, name, description, price);
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
      const restaurantID = query.restaurantID;

      try {
        const sortedItems = await sortItemsByPrice(pool, restaurantID);
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
      const restaurantID = query.restaurantID;
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
    else if (pathname.startsWith('/api/menu/upload/') && req.method === 'POST') {
      const pathParts = pathname.split('/');
      if (pathParts.length === 5 && pathParts[3] === 'upload') {
        const restaurantID = pathParts[4]; // Extract restaurant ID from URL

        upload(req, res, async (err) => {
          if (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'File upload error: ' + err.message }));
            return;
          }

          if (!req.file) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'No file uploaded or wrong file type' }));
            return;
          }

          try {
            // Parse the PDF from the file buffer
            const data = await pdf(req.file.buffer);
            // Parse menu items from the extracted text and the restaurant ID
            const items = parseMenuItemsFromPDF(data.text, restaurantID);

            // Attempt to add each item to the database
            const results = await Promise.all(
              items.map(item => addItem(pool, item.restaurantID, item.name, item.description, item.price))
            );

            // Send back success response with count of items added
            res.statusCode = 201;
            res.end(JSON.stringify({ message: 'Menu items added successfully', itemsAdded: results.length }));
          } catch (error) {
            console.error('Error processing PDF file:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to process PDF file' }));
          }
        });
      } else {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid URL format' }));
      }
    }
    // Cart Functions
    else if (req.url === '/cart/add' && req.method === 'POST') {
      // Parse the incoming request body
      let body = '';
      req.on('data', chunk => {
          body += chunk.toString();
      });

      req.on('end', async () => {
          try {
              // Parse JSON data from the request body
              const { cartId, itemId, quantity } = JSON.parse(body);

              // Add item to cart
              const result = await addItemToCart(pool, cartId, itemId, quantity);

              // Respond with success message
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ message: 'Item added to cart', result }));
          } catch (error) {
              // Respond with error message
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: error.message }));
          }
      });
    }
    else if (pathname === '/cart/delete' && method === 'DELETE') {
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
    else if (pathname === '/cart/clear' && method === 'DELETE') {
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
}

console.log('JWT Secret:', process.env.ACCESS_TOKEN_SECRET);
startServer();
