const http = require('http');
const mysql = require('mysql2/promise');

//start server
const server = http.createServer((request, response) => {
    if (request.method === 'POST') {
        handlePostRequest(request, response); 
    } else {
        response.writeHead(405); 
        response.end('Only POST method is supported');
    }
});

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'sweteam',
    database: 'PickupPlus'
});

db.then(connection => {
    console.log('Connected with id: ' + connection.threadId);
}).catch(err => {
    console.error('Error connecting to database: ' + err.stack);
});

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

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = server;