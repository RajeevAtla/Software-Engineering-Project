const http = require('http');
const mysql = require('mysql2/promise');
const url = require('url');

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

//openMenu function. Function should open menu based on the restaurantID. 
async function openMenu(restaurantID) {
    let connection;
    try {
        connection = await pool.getConnection(); // Get a connection from the pool
        const query = 'SELECT * FROM MenuItem WHERE restaurantid = ?';
        const [results] = await connection.query(query, [restaurantID]);

        // Assuming results is an array of menu items, we return it directly.
        return results; // Directly return the array of menu items.
    } catch (err) {
        console.error("Error in openMenu: ", err);
        throw err;
    } finally {
        if (connection) connection.release(); // Release the connection back to the pool
    }
}

async function addItem(itemID) {
    let connection;
    try {
        connection = await pool.getConnection();
        const query = 'INSERT INTO MenuItem (id) VALUES (?)';
        const [results] = await connection.query(query, [itemID]);
        return results;
    } catch (err) {
        console.error("Error in addItem: ", err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

async function deleteItem(itemID) {
    let connection;
    try {
        connection = await pool.getConnection();
        const query = 'DELETE FROM MenuItem WHERE id = ?';
        const [results] = await connection.query(query, [itemID]);
        return results;
    } catch (err) {
        console.error("Error in deleteItem: ", err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

async function searchItems(itemID) {
    let connection;
    try {
        connection = await pool.getConnection();
        const query = 'SELECT * FROM MenuItem WHERE id = ?';
        const [results] = await connection.query(query, [itemID]);
        return results;
    } catch (err) {
        console.error("Error in searchItems: ", err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

async function listItemCategories(restaurantID) {
    let connection;
    try {
        connection = await pool.getConnection();
        const query = 'SELECT category FROM categories WHERE restaurant_id = ?';
        const [results] = await connection.query(query, [restaurantID]);
        return results;
    } catch (err) {
        console.error("Error in listItemCategories: ", err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

const server = http.createServer(async (request, response) => {
    const parsedUrl = url.parse(request.url, true); // Parse the URL of the request
    const pathname = parsedUrl.pathname; // Get the pathname of the request
    const query = parsedUrl.query; // Extract the query string as an object

    // Set the response header for JSON content
    response.setHeader('Content-Type', 'application/json');

    if (pathname === '/menu') {
        if (request.method === 'GET') {
            // Make sure to declare and initialize restaurantID from query parameters
            const restaurantID = query.restaurantID; // Correctly obtain restaurantID from query

            if (restaurantID) { // Ensure restaurantID is provided
                try {
                    const menu = await openMenu(restaurantID);
                    response.end(JSON.stringify(menu));
                } catch (error) {
                    // Handle errors from openMenu, including database connection issues
                    response.statusCode = 500;
                    response.end(JSON.stringify({ error: error.message }));
                }
            } else {
                // Respond with an error if restaurantID wasn't provided
                response.statusCode = 400; // Bad Request
                response.end(JSON.stringify({ error: "Missing restaurantID parameter" }));
            }
        } else {
            // Handle unsupported methods for the /menu endpoint
            response.statusCode = 405; // Method Not Allowed
            response.end(JSON.stringify({ error: 'Method not allowed' }));
        }
    } else {
        // Handle requests to unsupported endpoints
        response.statusCode = 404; // Not Found
        response.end(JSON.stringify({ error: 'Not found' }));
    }
});

const hostname = '127.0.0.1';
const PORT = 3000;
server.listen(PORT, hostname, () => {
    console.log(`Server running on port ${PORT}`);
});



module.exports = server;
