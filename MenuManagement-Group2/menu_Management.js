const http = require('http');
const mysql = require('mysql2/promise');
const url = require('url');

//connect to mySQL
const db = {
    host: 'localhost',
    user: 'root', //To other teams viewing `this` file, change this name accordingly to run
    password: 'sweteam', //To other teams viewing this file, change this name accordingly to run
    database: 'PickupPlus'
};

//openMenu function. Function should open menu based on the restaurantID. 
async function openMenu(restaurantID) {
    let connection;
    try {
        connection = await mysql.createConnection(db);
        const query = 'SELECT * FROM MenuItem WHERE restaurantid = ?';
        const [results] = await connection.query(query, [restaurantID]);
        let menu = results.length > 0 ? JSON.parse(results[0].menu) : null;
        return menu;
    } catch (err) {
        console.error("Error in openMenu: ", err);
        throw err;
    } finally {
        if (connection) connection.end();
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
    // Parsing the URL
    const parsedUrl = url.parse(request.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    // Set response header for JSON
    response.setHeader('Content-Type', 'application/json');

    // Handling different API endpoints
    try {
        switch (pathname) {
            case '/menu':
                if (request.method === 'GET') {
                    const restaurantID = query.restaurantID;
                    const menu = await openMenu(restaurantID);
                    response.end(JSON.stringify(menu));
                } else {
                    response.statusCode = 405;
                    response.end(JSON.stringify({ error: 'Method not allowed' }));
                }
                break;

            case '/item':
                if (request.method === 'POST') {
                    const itemID = query.itemID;
                    const result = await addItem(itemID);
                    response.end(JSON.stringify(result));
                } else if (request.method === 'DELETE') {
                    const itemID = query.itemID;
                    const result = await deleteItem(itemID);
                    response.end(JSON.stringify(result));
                } else if (request.method === 'GET') {
                    const itemID = query.itemID;
                    const result = await searchItems(itemID);
                    response.end(JSON.stringify(result));
                } else {
                    response.statusCode = 405;
                    response.end(JSON.stringify({ error: 'Method not allowed' }));
                }
                break;

            case '/categories':
                if (request.method === 'GET') {
                    const restaurantID = query.restaurantID;
                    const categories = await listItemCategories(restaurantID);
                    response.end(JSON.stringify(categories));
                } else {
                    response.statusCode = 405;
                    response.end(JSON.stringify({ error: 'Method not allowed' }));
                }
                break;

            default:
                response.statusCode = 404;
                response.end(JSON.stringify({ error: 'Not found' }));
                break;
        }
    } catch (error) {
        response.statusCode = 500;
        response.end(JSON.stringify({ error: error.message }));
    }
});

const hostname = '127.0.0.1';
const PORT = 3000;
server.listen(PORT, hostname, () => {
    console.log(`Server running on port ${PORT}`);
});



module.exports = server;