const http = require('http');
const mysql = require('mysql2/promise');


//connect to mySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', //To other teams viewing this file, change this name accordingly to run
    password: 'sweteam', //To other teams viewing this file, change this name accordingly to run
    database: 'PickupPlus'
});

db.then(connection => {
    console.log('Connected with id: ' + connection.threadId);
}).catch(err => {
    console.error('Error connecting to database: ' + err.stack);
});

//openMenu function. Function should open menu based on the restaurantID. 
async function openMenu(restaurantID) {
    try {
        const connection = await db;
        const query = 'SELECT menu FROM restaurants WHERE id = ?';
        const [results] = await connection.query(query, [restaurantID]);
        connection.release();

        let menu = results.length > 0 ? JSON.parse(results[0].menu) : null;
        return menu;
    } catch (err) {
        console.error("Error in openMenu: ", err);
        throw err;
    }
}

//addItem function that adds items to the cart 
async function addItem(itemID) {
    try {
        const connection = await db;
        const query = 'INSERT INTO items (id) VALUES (?)';
        const [results] = await connection.query(query, [itemID]);
        connection.release();

        return results;
    } catch (err) {
        console.error("Error in addItem: ", err);
        throw err;
    }
}

//deleteItem function that deletes items from the cart
async function deleteItem(itemID) {
    try {
        const connection = await db;
        const query = 'DELETE FROM items WHERE id = ?';
        const [results] = await connection.query(query, [itemID]);
        connection.release();

        return results;
    } catch (err) {
        console.error("Error in deleteItem: ", err);
        throw err;
    }
}

//searchItems function that searches items based on name/ID
async function searchItems(itemID) {
    try {
        const connection = await db;
        const query = 'SELECT * FROM items WHERE id = ?';
        const [results] = await connection.query(query, [itemID]);
        connection.release();

        return results;
    } catch (err) {
        console.error("Error in searchItems: ", err);
        throw err;
    }
}

//listItemCategories function that lists different item categories inside of given restaurantID
async function listItemCategories(restaurantID) {
    try {
        const connection = await db;
        const query = 'SELECT category FROM categories WHERE restaurant_id = ?';
        const [results] = await connection.query(query, [restaurantID]);
        connection.release();

        return results;
    } catch (err) {
        console.error("Error in listItemCategories: ", err);
        throw err;
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


const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = server;