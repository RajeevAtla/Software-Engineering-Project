const http = require('http');
const mysql = require('mysql2/promise');
const url = require('url');

//connect to mySQL
// Connection pool configuration
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'sweteam',
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
        const query = 'INSERT INTO MenuItem (itemid) VALUES (?)';
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
        const query = 'DELETE FROM MenuItem WHERE itemid = ?';
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
        const query = 'SELECT * FROM MenuItem WHERE Itemid = ?';
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
        const query = 'SELECT category FROM Restaurant WHERE restaurantid = ?';
        const [results] = await connection.query(query, [restaurantID]);
        return results;
    } catch (err) {
        console.error("Error in listItemCategories: ", err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}


async function sortItemsByPrice(restaurantID) {
    let connection;
    try {
        connection = await pool.getConnection();
        const query = 'SELECT * FROM MenuItem WHERE restaurantid = ? ORDER BY price ASC';
        const [sortedItems] = await connection.query(query, [restaurantID]);
        return sortedItems;
    } catch (err) {
        console.error("Error in sortItemsByPrice: ", err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

async function getItemsBelowPrice(restaurantID, priceLimit) {
    let connection;
    try {
        connection = await pool.getConnection();
        const query = 'SELECT * FROM MenuItem WHERE restaurantid = ? AND price <= ?';
        const [items] = await connection.query(query, [restaurantID, priceLimit]);
        return items;
    } catch (err) {
        console.error("Error in getItemsBelowPrice: ", err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}


module.exports = { openMenu, addItem, deleteItem, searchItems, listItemCategories, sortItemsByPrice, getItemsBelowPrice };