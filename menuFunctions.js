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

async function sortItemsByPrice() {
    let connection;
    try {
        connection = await pool.getConnection();
        const query = 'SELECT * FROM MenuItem ORDER BY price ASC';
        const [sortedItems] = await connection.query(query);
        return sortedItems;
    } catch (err) {
        console.error("Error in sortItemsByPrice: ", err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

async function getItemsBelowPrice(priceLimit) {
    let connection;
    try {
        connection = await pool.getConnection();
        const query = 'SELECT * FROM items WHERE price <= ?';
        const [items] = await connection.query(query, [priceLimit]);
        return items;
    } catch (err) {
        console.error("Error in getItemsBelowPrice: ", err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

module.exports = { openMenu, addItem, deleteItem, searchItems, listItemCategories, sortItemsByPrice, sortItemsByPrice };