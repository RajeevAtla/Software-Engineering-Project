//Dealing with restaurant management part of project
//Focus on the following operations: registerRestaurant, editRestaurant, deleteRestaurant, and login


const http = require('http');
const url = require('url');
const mysql = require('mysql2');

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost', 
  user: 'root',
  password: 'your_password',
  database: 'your_db_name'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to database: ' + err.stack);
    return;
  }
  console.log('Connected with id: ' + db.threadId);
});

// creates and stores restuarant info in db
// also doesn't really do any validation other than basic error checking
function registerRestaurant(req, res) {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const {name, address, email, phonenumber, category} = JSON.parse(body);

        // sets up restaurant, specific info to be inserted in db query
        // restaurantid will be AUTO_INCREMENTed
        const sql = 'INSERT INTO restaurant (name, address, email, phonenumber, category) VALUES (?, ?, ?, ?, ?)';

        db.query(sql, [name, address, email, phonenumber, category], (error, results) => {
            if (error){
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({ message: "Internal Server Error", error: error.message }));
                return;
            }

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ restaurantid: results.insertId }));
        });
    });
}
// login and retrieve restaurant details using the restaurantId
function restaurantLogin(req, res, restaurantid) {
  const sql = 'SELECT * FROM Restaurant WHERE restaurantid = ?';

  db.query(sql, [restaurantid], (error, results) => {
      if (error || results.length === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: "Restaurant not found" }));
          return;
      }
      const restaurantDetails = results[0];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(restaurantDetails));
  });
}


// field should contain the name of a row in the db, i.e. 'name' 'address' 'email', etc.
function editRestaurant(req, res, restaurantid){
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    })

    req.on('end', () => {
      const updateFields = JSON.parse(body);
  
      const sql = `UPDATE restaurant SET ? WHERE restaurantid = ?`;
  
      db.query(sql, [updateFields, restaurantid], (error, results) => {
        if (error || results.affectedRows === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: "Restaurant not found or update failed" }));
          return;
        }
  
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "Restaurant updated successfully" }));
      });
    });
}

function getRestaurantId(req, res) {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const { name } = JSON.parse(body);

        const sql = 'SELECT restaurantid FROM restaurant WHERE name = ?';

        db.query(sql, [name], (error, results) => {
            if (error || results.length === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "Restaurant not found" }));
                return;
            }

            // Assuming the name is unique, return the restaurant ID
            const restaurantId = results[0].restaurantid;

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ restaurantId }));
        });
    });
}



function deleteRestaurant(req, res, restaurantid){
    const sql = 'DELETE FROM restaurant WHERE restaurantid = ?';

    db.query(sql, [restaurantid], (error, results) => {
        if (error || results.affectedRows === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "Restaurant not found or already removed" }));
        return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "Restaurant removed successfully" }));
    });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Extract restaurantid for routes that include it
    const matchRestaurantId = path.match(/^\/api\/restaurants\/([0-9a-zA-Z]+)(\/.*)?$/);
    const restaurantid = matchRestaurantId ? matchRestaurantId[1] : null;

  // Routing
  if (path === "/api/restaurants" && method === "POST") {
    // Register Restaurant, request should include name, address, email, phonenumber, and category
    registerRestaurant(req, res);
  } 
  else if (path === `/api/restaurants/${restaurantid}` && method === "GET") {
    // Restaurant Login
    restaurantLogin(req, res, restaurantid);
  } 
  else if (path === "/api/restaurants" && method === "GET") {
    // Get Restaurant ID, requires name JSON object in request
    getRestaurantId(req, res);
  } 
  else if (path === `/api/restaurants/${restaurantid}` && method === "PUT") {
    // Edit Restaurant
    editRestaurant(req, res, restaurantid);
  } 
  else if (path === `/api/restaurants/${restaurantid}` && method === "DELETE") {
    // Delete Restaurant
    deleteRestaurant(req, res, restaurantid);
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

